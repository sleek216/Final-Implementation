# FashionVerse Product APIs List

This document contains a comprehensive list of all product-related API endpoints in the FashionVerse project.

## Base URL
* Local Development: `http://localhost:5005`

---

## API Endpoints Reference Table

| # | HTTP Method | API Endpoint | Access Level / Auth | Description |
|---|:---:|---|---|---|
| **1** | **GET** | `/api/products/` | Public | Fetches all active products |
| **2** | **GET** | `/api/products/:id` | Public | Fetches a single product by its ID |
| **3** | **GET** | `/api/products/categories` | Public | Fetches all categories |
| **4** | **GET** | `/api/products/colors` | Public | Fetches all available colors |
| **5** | **GET** | `/api/products/compare/:productId/brands` | Public | Fetches comparison brands for a product |
| **6** | **GET** | `/api/products/compare/:productId/products` | Public | Fetches comparison products |
| **7** | **POST** | `/api/products/:id/review` | User Token | Adds a review to a product |
| **8** | **POST** | `/api/products/` | Admin Token | Creates a new product |
| **9** | **PUT** | `/api/products/:id` | Admin Token | Updates product details |
| **10** | **DELETE** | `/api/products/:id` | Admin Token | Deletes a product |
| **11** | **GET** | `/api/admin/products` | Admin Token | Fetches all products for the admin panel |
| **12** | **POST** | `/api/admin/products` | Admin Token | Creates a product from the admin panel |
| **13** | **PUT** | `/api/admin/products/:id` | Admin Token | Updates a product from the admin panel |
| **14** | **DELETE** | `/api/admin/products/:id` | Admin Token | Deletes a product from the admin panel |
| **15** | **PUT** | `/api/admin/products/:id/toggle-status` | Admin Token | Toggles product status (Active/Inactive) |
| **16** | **GET** | `/api/brand/products` | Brand Token | Fetches all products owned by the authenticated brand |
| **17** | **POST** | `/api/brand/products` | Brand Token | Creates a new product for a brand (supports multi-image upload & size charts) |
| **18** | **PUT** | `/api/brand/products/:id` | Brand Token | Updates brand product details |
| **19** | **DELETE** | `/api/brand/products/:id` | Brand Token | Deletes a brand product |
| **20** | **PATCH** | `/api/brand/products/:id/3d` | Brand Token | Toggles 3D viewer support for a brand product |
| **21** | **GET** | `/api/recommendations/popular` | Public | Fetches popular products |
| **22** | **GET** | `/api/recommendations/related/:productId` | Public | Fetches related products recommendations |
| **23** | **GET** | `/api/recommendations/:userId` | Public | Fetches personalized recommendations for a user |
| **24** | **POST** | `/api/recommendations/homepage` | Public | Fetches homepage recommendations |
| **25** | **POST** | `/api/recommendations/pdp` | Public | Fetches Product Detail Page (PDP) recommendations |
| **26** | **POST** | `/api/recommendations/cart` | Public | Fetches cart page recommendations |
| **27** | **POST** | `/api/reviews/` | User Token | Creates a product review |
| **28** | **GET** | `/api/reviews/product/:productId` | Public | Fetches all reviews and ratings for a product |
| **29** | **GET** | `/api/reviews/top-rated` | Public | Fetches all top-rated products |
