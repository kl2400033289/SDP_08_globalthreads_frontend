const STORAGE_KEY = "customizationRequests";

export const loadCustomizationRequests = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveCustomizationRequest = ({ product, message, buyer }) => {
  const existingRequests = loadCustomizationRequests();

  const request = {
    id: Date.now(),
    productId: product.id,
    productName: product.name,
    artisan: product.artisan || "artisan",
    buyer: buyer?.name || buyer?.username || buyer?.email || "Anonymous",
    message: message.trim(),
    status: "new",
    createdAt: new Date().toLocaleString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify([request, ...existingRequests]));
  return request;
};

export { STORAGE_KEY };