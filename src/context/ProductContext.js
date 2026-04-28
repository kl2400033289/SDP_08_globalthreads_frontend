import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { PRODUCTS_BASE_URL } from "../api";
import { defaultCatalog } from "../data/catalog";

export const ProductContext = createContext();

const API_URL = PRODUCTS_BASE_URL;
const PRODUCTS_STORAGE_KEY = "products";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const dedupeProductsById = (items = []) => {
  const productMap = new Map();

  items.forEach((product) => {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, product);
    }
  });

  return Array.from(productMap.values());
};

const readStoredProducts = () => {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const writeStoredProducts = (products) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

const isBlank = (value) =>
  value === "" || value == null || (typeof value === "string" && value.trim() === "");

const pickFirstNonBlank = (...values) => values.find((value) => !isBlank(value));

const toNumberOr = (value, fallback = 0) => {
  if (isBlank(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const findCatalogMatch = (product = {}) =>
  defaultCatalog.find((item) => Number(item.id) === Number(product.id)) ||
  defaultCatalog.find(
    (item) =>
      item.name === product.name ||
      item.title === product.title ||
      item.name === product.title ||
      item.title === product.name
  ) ||
  {};

const normalizeProduct = (product = {}) => {
  const catalogFallback = findCatalogMatch(product);
  const resolvedName = pickFirstNonBlank(
    product.name,
    product.title,
    catalogFallback.name,
    catalogFallback.title,
    ""
  );
  const resolvedTitle = pickFirstNonBlank(
    product.title,
    product.name,
    catalogFallback.title,
    catalogFallback.name,
    ""
  );
  const resolvedImage = pickFirstNonBlank(
    product.image,
    product.imageUrl,
    catalogFallback.image,
    catalogFallback.imageUrl,
    ""
  );
  const resolvedImageUrl = pickFirstNonBlank(
    product.imageUrl,
    product.image,
    catalogFallback.imageUrl,
    catalogFallback.image,
    ""
  );

  return {
    id: toNumberOr(pickFirstNonBlank(product.id, catalogFallback.id, Date.now()), Date.now()),
    name: resolvedName,
    title: resolvedTitle,
    price: toNumberOr(
      pickFirstNonBlank(
        product.price,
        product.sellingPrice,
        catalogFallback.price,
        0
      ),
      0
    ),
    stock: toNumberOr(pickFirstNonBlank(product.stock, catalogFallback.stock, 0), 0),
    designNotes: pickFirstNonBlank(product.designNotes, catalogFallback.designNotes, ""),
    image: resolvedImage,
    imageUrl: resolvedImageUrl,
    rating: toNumberOr(
      pickFirstNonBlank(product.rating, catalogFallback.rating, 0),
      0
    ),
    reviews: Array.isArray(product.reviews)
      ? product.reviews
      : Array.isArray(catalogFallback.reviews)
        ? catalogFallback.reviews
        : [],
    artisan: pickFirstNonBlank(product.artisan, catalogFallback.artisan, "artisan"),
    sizes: Array.isArray(product.sizes)
      ? product.sizes
      : Array.isArray(catalogFallback.sizes)
        ? catalogFallback.sizes
        : [],
    productStory: pickFirstNonBlank(
      product.productStory,
      catalogFallback.productStory,
      ""
    ),
    description: pickFirstNonBlank(product.description, catalogFallback.description, ""),
    category: String(
      pickFirstNonBlank(product.category, catalogFallback.category, "general")
    ).toLowerCase(),
  };
};

export function ProductProvider({ children }) {
  const [products, setProductsState] = useState([]);
  const [ready, setReady] = useState(false);

  const setProducts = (nextValue) => {
    setProductsState((current) => {
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(current) : nextValue;
      const normalizedProducts = dedupeProductsById(
        (resolvedValue || []).map(normalizeProduct)
      );

      writeStoredProducts(normalizedProducts);
      return normalizedProducts;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const response = await axios.get(API_URL, getAuthConfig());
        const data = response.data;
        const rawProducts = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        const loadedProducts = dedupeProductsById(rawProducts.map(normalizeProduct));
        const cachedProducts = dedupeProductsById(readStoredProducts().map(normalizeProduct));

        if (!isMounted) {
          return;
        }

        const catalogProducts = dedupeProductsById(defaultCatalog.map(normalizeProduct));
        const mergedProducts = dedupeProductsById([
          ...loadedProducts,
          ...cachedProducts,
          ...catalogProducts,
        ]);

        setProductsState(mergedProducts);
        writeStoredProducts(mergedProducts);
      } catch {
        if (isMounted) {
          const cachedProducts = dedupeProductsById(readStoredProducts().map(normalizeProduct));
          const seededProducts = dedupeProductsById([
            ...cachedProducts,
            ...defaultCatalog.map(normalizeProduct),
          ]);
          setProductsState(seededProducts);
          writeStoredProducts(seededProducts);
        }
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, ready }}>
      {children}
    </ProductContext.Provider>
  );
}