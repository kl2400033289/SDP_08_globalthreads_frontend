const BASE_URL = "http://localhost:8080";
export const AUTH_BASE_URL = `${BASE_URL}/auth`;
export const PRODUCTS_BASE_URL = "http://localhost:5000/api/products";

const JSON_HEADERS = {
	"Content-Type": "application/json",
};

const readResponseBody = async (response) => {
	const text = await response.text();

	if (!response.ok) {
		throw new Error(text || `Request failed with status ${response.status}`);
	}

	return text;
};

export const registerUser = async ({ username, email, password }) => {
	const response = await fetch(`${AUTH_BASE_URL}/register`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ username, email, password }),
	});

	return readResponseBody(response);
};

export const loginUser = async ({ email, password }) => {
	const response = await fetch(`${AUTH_BASE_URL}/login`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ email, password }),
	});

	const token = await readResponseBody(response);
	localStorage.setItem("token", token);
	return token;
};

export const sendForgotPasswordOtp = async (email) => {
	const response = await fetch(`${AUTH_BASE_URL}/forgot-password`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ email }),
	});

	return readResponseBody(response);
};

export const verifyForgotPasswordOtp = async ({ email, otp }) => {
	const response = await fetch(`${AUTH_BASE_URL}/verify-otp`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ email, otp }),
	});

	return readResponseBody(response);
};

export const resetForgotPassword = async ({ email, otp, newPassword }) => {
	const response = await fetch(`${AUTH_BASE_URL}/reset-password`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ email, otp, newPassword }),
	});

	return readResponseBody(response);
};

export const getAuthHeaders = () => {
	const token = localStorage.getItem("token");

	return token
		? {
				Authorization: `Bearer ${token}`,
			}
		: {};
};

export const authFetch = (url, options = {}) => {
	const mergedHeaders = {
		...(options.headers || {}),
		...getAuthHeaders(),
	};

	return fetch(url, {
		...options,
		headers: mergedHeaders,
	});
};

// Product API functions
export const createProduct = async (productData) => {
	try {
		const response = await authFetch(PRODUCTS_BASE_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(productData),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || "Failed to create product");
		}

		const result = await response.json();
		return result.product;
	} catch (error) {
		throw error;
	}
};

export const updateProduct = async (productId, productData) => {
	try {
		const response = await authFetch(`${PRODUCTS_BASE_URL}/${productId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(productData),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || "Failed to update product");
		}

		const result = await response.json();
		return result.product;
	} catch (error) {
		throw error;
	}
};

export const deleteProduct = async (productId) => {
	try {
		const response = await authFetch(`${PRODUCTS_BASE_URL}/${productId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || "Failed to delete product");
		}

		return await response.json();
	} catch (error) {
		throw error;
	}
};

export default BASE_URL;