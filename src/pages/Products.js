import { useState, useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import { useLanguage } from "../context/LanguageContext";
import { createProduct, updateProduct, deleteProduct } from "../api";
import toast from "react-hot-toast";
import "./AdminDashboard.css";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

function Products() {
  const { products, setProducts } = useContext(ProductContext);
  const { t } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "women",
    rating: "",
    sizes: [],
    productStory: "",
    description: "",
    image: "",
  });

  const [preview, setPreview] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeToggle = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      category: "women",
      rating: "",
      sizes: [],
      productStory: "",
      description: "",
      image: "",
    });
    setPreview("");
    setEditingProductId(null);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      toast.error("Please fill in required fields (name, price, image)");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: form.name,
        title: form.name,
        price: Number(form.price),
        category: form.category,
        rating: form.rating ? Number(form.rating) : 0,
        sizes: form.sizes,
        productStory: form.productStory,
        description: form.description,
        image: form.image,
        imageUrl: form.image,
      };

      let result;
      if (editingProductId) {
        result = await updateProduct(editingProductId, productData);
        toast.success("Product updated successfully!");
      } else {
        result = await createProduct(productData);
        toast.success("Product added successfully!");
      }

      // Update local products list
      if (editingProductId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? result : p))
        );
      } else {
        setProducts((prev) => [...prev, result]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setForm({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "women",
      rating: product.rating || "",
      sizes: product.sizes || [],
      productStory: product.productStory || "",
      description: product.description || "",
      image: product.image || "",
    });
    setPreview(product.image || "");
    setEditingProductId(product.id);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="admin-title">Product Management</h1>

      <div className="admin-form-card">
        <h2>{editingProductId ? "Edit Product" : "Add New Product"}</h2>

        <form onSubmit={addProduct} className="admin-form">
          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter product name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              id="price"
              type="number"
              name="price"
              min="0"
              placeholder="Enter price"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label htmlFor="rating">Rating (0-5)</label>
            <input
              id="rating"
              type="number"
              name="rating"
              min="0"
              max="5"
              step="0.1"
              placeholder="Enter rating"
              value={form.rating}
              onChange={handleChange}
            />
          </div>

          {/* Sizes */}
          <div className="form-group">
            <label>Sizes</label>
            <div className="size-checkbox-grid">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-option ${form.sizes.includes(size) ? "selected" : ""}`}
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Product Story */}
          <div className="form-group">
            <label htmlFor="productStory">Product Story</label>
            <textarea
              id="productStory"
              name="productStory"
              rows="3"
              placeholder="Tell the story behind this product..."
              value={form.productStory}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Enter detailed product description..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Product Image *</label>
            <input
              id="image"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="form-group">
              <img
                src={preview}
                alt="preview"
                className="image-preview"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "⏳ Saving..." : (editingProductId ? "🔄 Update Product" : "➕ Add Product")}
            </button>
            {editingProductId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="admin-table">
        <h2>All Products ({products.length})</h2>

        {products.length === 0 ? (
          <p className="empty-text">No products yet. Add your first product above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Sizes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category || "general"}</td>
                  <td>₹{p.price}</td>
                  <td>{p.rating ? `${p.rating} ⭐` : "-"}</td>
                  <td>{p.sizes?.length > 0 ? p.sizes.join(", ") : "-"}</td>
                  <td className="table-actions">
                    <button
                      className="edit-btn"
                      onClick={() => editProduct(p)}
                      title="Edit product"
                      disabled={loading}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProduct(p.id)}
                      title="Delete product"
                      disabled={loading}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Products;
