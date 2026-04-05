import { createContext, useState, useEffect } from "react";

import sareeImg from "../assets/saree.webp";
import kurtaImg from "../assets/kurta.webp";
import dupattaImg from "../assets/dupatta.webp";

export const ProductContext = createContext();

const defaultProducts = [
  {
    id: 1,
    name: "Handloom Saree",
    price: 2499,
    costPrice: 1500,
    stock: 25,
    designNotes: "Traditional handloom design with intricate patterns",
    image: sareeImg,
    rating: 4.5,
    reviews: [],
    artisan: "artisan",
    certificate: "https://via.placeholder.com/600x300?text=Govt+Authenticity+Certificate"
  },
  {
    id: 2,
    name: "Cotton Kurta",
    price: 1499,
    costPrice: 800,
    stock: 40,
    designNotes: "Comfortable cotton kurta with modern fit",
    image: kurtaImg,
    rating: 3.2,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 3,
    name: "Silk Dupatta",
    price: 899,
    costPrice: 450,
    stock: 30,
    designNotes: "Elegant silk dupatta with embroidered borders",
    image: dupattaImg,
    rating: 4.0,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 4,
    name: "Banarasi Zari Saree",
    price: 3299,
    costPrice: 2000,
    stock: 15,
    designNotes: "Premium Banarasi saree with gold zari work",
    image: sareeImg,
    rating: 4.7,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 5,
    name: "Indigo Block Kurta",
    price: 1899,
    costPrice: 1000,
    stock: 20,
    designNotes: "Hand-block printed indigo kurta with traditional motifs",
    image: kurtaImg,
    rating: 4.1,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 6,
    name: "Phulkari Silk Dupatta",
    price: 1199,
    costPrice: 650,
    stock: 18,
    designNotes: "Phulkari embroidered silk dupatta with floral patterns",
    image: dupattaImg,
    rating: 4.3,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 7,
    name: "Kanjivaram Festive Saree",
    price: 2799,
    costPrice: 1700,
    stock: 12,
    designNotes: "Rich Kanjivaram saree perfect for festive occasions",
    image: sareeImg,
    rating: 4.4,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 8,
    name: "Classic Cotton Kurta Set",
    price: 1399,
    costPrice: 750,
    stock: 35,
    designNotes: "Classic cotton kurta set with matching accessories",
    image: kurtaImg,
    rating: 3.9,
    reviews: [],
    artisan: "artisan",
  },
  {
    id: 9,
    name: "Bandhani Designer Dupatta",
    price: 999,
    costPrice: 500,
    stock: 22,
    designNotes: "Designer bandhani dupatta with tie-dye patterns",
    image: dupattaImg,
    rating: 4.2,
    reviews: [],
    artisan: "artisan",
  },
];

const dedupeProductsById = (items = []) => {
  const productMap = new Map();

  items.forEach((product) => {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, product);
    }
  });

  return Array.from(productMap.values());
};

export function ProductProvider({ children }) {
  // ✅ load from localStorage only once on first render
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("products");

      if (saved) {
        const parsedProducts = JSON.parse(saved);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          return dedupeProductsById(parsedProducts);
        }
      }

      return dedupeProductsById(defaultProducts);
    } catch {
      return dedupeProductsById(defaultProducts);
    }
  });

  // ✅ auto save
  useEffect(() => {
    const dedupedProducts = dedupeProductsById(products);

    if (dedupedProducts.length !== products.length) {
      setProducts(dedupedProducts);
      return;
    }

    localStorage.setItem("products", JSON.stringify(dedupedProducts));
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
}