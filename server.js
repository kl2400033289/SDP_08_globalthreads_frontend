require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.BACKEND_PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "global_threads",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: "utf8mb4",
});

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      cost_price DECIMAL(12,2) NULL,
      stock INT NOT NULL DEFAULT 0,
      design_notes TEXT NULL,
      image_data LONGTEXT NOT NULL,
      image_hash CHAR(64) NOT NULL,
      rating DECIMAL(4,2) NOT NULL DEFAULT 0,
      reviews_json LONGTEXT NOT NULL,
      artisan VARCHAR(255) NOT NULL DEFAULT 'artisan',
      sizes_json LONGTEXT NOT NULL,
      product_story TEXT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_products_sort_order (sort_order)
    )
  `);

    // Backward compatibility for existing databases created before category support.
    const [categoryColumnRows] = await pool.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'products'
          AND column_name = 'category'
      `
    );

    if ((categoryColumnRows?.[0]?.count || 0) === 0) {
      await pool.query(
        "ALTER TABLE products ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general'"
      );
    }
};

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const buildImageHash = (imageData = "") =>
  crypto.createHash("sha256").update(imageData).digest("hex");

const normalizeProduct = (product = {}, sortOrder = 0) => {
  const imageData = product.image || product.imageData || "";

  return {
    id: Number(product.id) || Date.now() + sortOrder,
    sortOrder,
    name: product.name || "",
      category: String(product.category || "general").toLowerCase(),
    price: Number(product.price) || 0,
    costPrice:
      product.costPrice === "" || product.costPrice == null
        ? null
        : Number(product.costPrice),
    stock:
      product.stock === "" || product.stock == null
        ? 0
        : Number(product.stock),
    designNotes: product.designNotes || "",
    imageData,
    imageHash: buildImageHash(imageData),
    rating: Number(product.rating) || 0,
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    artisan: product.artisan || "artisan",
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    productStory: product.productStory || "",
    description: product.description || "",
  };
};

const mapRowToProduct = (row) => ({
  id: Number(row.id),
  name: row.name,
    category: String(row.category || "general").toLowerCase(),
  price: Number(row.price) || 0,
  costPrice: row.cost_price == null ? null : Number(row.cost_price),
  stock: Number(row.stock) || 0,
  designNotes: row.design_notes || "",
  image: row.image_data,
  rating: Number(row.rating) || 0,
  reviews: parseJson(row.reviews_json, []),
  artisan: row.artisan || "artisan",
  sizes: parseJson(row.sizes_json, []),
  productStory: row.product_story || "",
  description: row.description || "",
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY sort_order ASC, id ASC"
    );

    res.json({ products: rows.map(mapRowToProduct) });
  } catch (error) {
    res.status(500).json({ message: "Failed to load products." });
  }
});

app.put("/api/products/sync", async (req, res) => {
  const incomingProducts = Array.isArray(req.body.products) ? req.body.products : [];
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM products");

    for (let index = 0; index < incomingProducts.length; index += 1) {
      const product = normalizeProduct(incomingProducts[index], index);

      await connection.query(
        `
          INSERT INTO products (
            id,
            sort_order,
            name,
            category,
            price,
            cost_price,
            stock,
            design_notes,
            image_data,
            image_hash,
            rating,
            reviews_json,
            artisan,
            sizes_json,
            product_story,
            description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          product.id,
          product.sortOrder,
          product.name,
          product.category,
          product.price,
          product.costPrice,
          product.stock,
          product.designNotes,
          product.imageData,
          product.imageHash,
          product.rating,
          JSON.stringify(product.reviews),
          product.artisan,
          JSON.stringify(product.sizes),
          product.productStory,
          product.description,
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      products: incomingProducts,
      message:
        incomingProducts.length > 0
          ? "Products synced to MySQL."
          : "Products cleared from MySQL.",
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Failed to sync products." });
  } finally {
    connection.release();
  }
});

// Create a new product
app.post("/api/products", async (req, res) => {
  try {
    const product = normalizeProduct(req.body, 0);

    if (!product.name) {
      return res.status(400).json({ message: "Product name is required." });
    }

    await pool.query(
      `
        INSERT INTO products (
          id,
          sort_order,
          name,
          category,
          price,
          cost_price,
          stock,
          design_notes,
          image_data,
          image_hash,
          rating,
          reviews_json,
          artisan,
          sizes_json,
          product_story,
          description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        product.id,
        product.sortOrder,
        product.name,
        product.category,
        product.price,
        product.costPrice,
        product.stock,
        product.designNotes,
        product.imageData,
        product.imageHash,
        product.rating,
        JSON.stringify(product.reviews),
        product.artisan,
        JSON.stringify(product.sizes),
        product.productStory,
        product.description,
      ]
    );

    res.status(201).json({
      success: true,
      product,
      message: "Product created successfully.",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product." });
  }
});

// Update an existing product
app.put("/api/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = normalizeProduct(req.body, 0);
    product.id = productId;

    if (!product.name) {
      return res.status(400).json({ message: "Product name is required." });
    }

    await pool.query(
      `
        UPDATE products SET
          name = ?,
          category = ?,
          price = ?,
          cost_price = ?,
          stock = ?,
          design_notes = ?,
          image_data = ?,
          image_hash = ?,
          rating = ?,
          reviews_json = ?,
          artisan = ?,
          sizes_json = ?,
          product_story = ?,
          description = ?
        WHERE id = ?
      `,
      [
        product.name,
        product.category,
        product.price,
        product.costPrice,
        product.stock,
        product.designNotes,
        product.imageData,
        product.imageHash,
        product.rating,
        JSON.stringify(product.reviews),
        product.artisan,
        JSON.stringify(product.sizes),
        product.productStory,
        product.description,
        productId,
      ]
    );

    res.json({
      success: true,
      product,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    await pool.query("DELETE FROM products WHERE id = ?", [productId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product." });
  }
});

const startServer = async () => {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`Product API running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();