// Recommendation routes with brand enrichment
import express from 'express';
const router = express.Router();
import {
    getPopularProducts,
    getRelatedProducts,
    getRecommendations,
    getHomepageRecommendations,
    getPdpRecommendations,
    getCartRecommendations
} from '../services/recommendationService.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';

// Helper: enrich recommendation products with brand name from MongoDB
const enrichWithBrandNames = async (productList) => {
    if (!Array.isArray(productList) || productList.length === 0) return productList;

    try {
        // Get all product IDs
        const productIds = productList.map(p => p.product_id).filter(Boolean);
        console.log('[Recommendation] Enriching', productIds.length, 'products with brand names');

        // Fetch products from MongoDB with brand populated
        const dbProducts = await Product.find({ _id: { $in: productIds } })
            .populate('brand', 'name')
            .select('_id brand')
            .lean();

        console.log('[Recommendation] Found', dbProducts.length, 'products in DB');

        // Create a map of product_id -> brand_name
        const brandMap = {};
        dbProducts.forEach(p => {
            const brandName = (p.brand && typeof p.brand === 'object' && p.brand.name) ? p.brand.name : null;
            brandMap[p._id.toString()] = brandName;
        });

        console.log('[Recommendation] Brand map:', JSON.stringify(brandMap));

        // Enrich each product with brand_name
        return productList.map(p => ({
            ...p,
            brand_name: brandMap[p.product_id] || p.category || 'FashionVerse'
        }));
    } catch (err) {
        console.error('[Recommendation] Enrichment error:', err.message);
        return productList;
    }
};

// Home page - Popular products
router.get('/popular', async (req, res) => {
    try {
        const products = await getPopularProducts();
        console.log('[Recommendation] Raw products type:', typeof products, Array.isArray(products) ? 'array' : (products?.most_viewed ? 'has most_viewed' : 'unknown'));

        // Enrich with brand names
        let enrichedProducts = products;
        if (Array.isArray(products)) {
            enrichedProducts = await enrichWithBrandNames(products);
        } else if (products && Array.isArray(products.most_viewed)) {
            enrichedProducts = {
                ...products,
                most_viewed: await enrichWithBrandNames(products.most_viewed),
                top_rated: await enrichWithBrandNames(products.top_rated || products.most_viewed)
            };
        }

        res.json({ success: true, data: enrichedProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Product detail - Related products
router.get('/related/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { category } = req.query;
        const products = await getRelatedProducts(productId, category);

        // Enrich with brand names
        let enrichedProducts = products;
        if (products && Array.isArray(products.related_products)) {
            enrichedProducts = {
                ...products,
                related_products: await enrichWithBrandNames(products.related_products)
            };
        } else if (Array.isArray(products)) {
            enrichedProducts = await enrichWithBrandNames(products);
        }

        res.json({ success: true, data: enrichedProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// User recommendations
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const products = await getRecommendations(userId);
        
        // Enrich with brand names
        // Flask might return { recommended_products: [], interacted_products: [] } 
        // or just an array depending on the algorithm
        let enrichedData = products;
        
        if (products && Array.isArray(products.recommended_products)) {
            enrichedData = {
                ...products,
                recommended_products: await enrichWithBrandNames(products.recommended_products)
            };
        } else if (Array.isArray(products)) {
            enrichedData = await enrichWithBrandNames(products);
        }

        res.json({ success: true, data: enrichedData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Homepage recommendations proxy route (POST)
router.post('/homepage', async (req, res) => {
    try {
        const { user_id } = req.body;
        console.log('[Recommendation Route] Fetching homepage recommendations for user:', user_id);
        const result = await getHomepageRecommendations(user_id);
        
        let enrichedRecommendations = [];
        if (result && Array.isArray(result.recommendations)) {
            enrichedRecommendations = await enrichWithBrandNames(result.recommendations);
        }
        
        res.json({ success: true, recommendations: enrichedRecommendations });
    } catch (error) {
        console.error('[Recommendation Route] Homepage error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PDP related recommendations proxy route (POST)
router.post('/pdp', async (req, res) => {
    try {
        const { product_id, category } = req.body;
        console.log('[Recommendation Route] Fetching PDP recommendations for product:', product_id, 'category:', category);
        const result = await getPdpRecommendations(product_id, category);
        
        let enrichedRecommendations = [];
        if (result && Array.isArray(result.recommendations)) {
            enrichedRecommendations = await enrichWithBrandNames(result.recommendations);
        }
        
        res.json({ success: true, recommendations: enrichedRecommendations });
    } catch (error) {
        console.error('[Recommendation Route] PDP error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cart recommendations proxy route (POST)
router.post('/cart', async (req, res) => {
    try {
        const { cart_items, user_id } = req.body;
        console.log('[Recommendation Route] Fetching cart recommendations for user:', user_id, 'items:', cart_items);
        const result = await getCartRecommendations(cart_items, user_id);
        
        let enrichedRecommendations = [];
        if (result && Array.isArray(result.recommendations)) {
            enrichedRecommendations = await enrichWithBrandNames(result.recommendations);
        }
        
        res.json({ success: true, recommendations: enrichedRecommendations });
    } catch (error) {
        console.error('[Recommendation Route] Cart error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;