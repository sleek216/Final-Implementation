import axios from 'axios';

// Home page - Popular & Top Rated Products
export const getPopularProducts = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:5001/popular');
        return response.data;
    } catch (error) {
        console.error('Popular products error:', error.message);
        return [];
    }
};

// Product Detail Page - Related Products
export const getRelatedProducts = async (productId, category) => {
    try {
        const response = await axios.get(
            `http://127.0.0.1:5001/related/${productId}?category=${category}`
        );
        return response.data;
    } catch (error) {
        console.error('Related products error:', error.message);
        return [];
    }
};

// User based recommendations
export const getRecommendations = async (userId) => {
    try {
        // Flask expects POST with user_id in form-data
        const formData = new URLSearchParams();
        formData.append('user_id', userId);
        formData.append('algorithm', 'hybrid'); // Default to hybrid for best results

        const response = await axios.post('http://127.0.0.1:5001/recommend', formData);
        return response.data;
    } catch (error) {
        console.error('Recommendation error:', error.message);
        return [];
    }
};

// Fetch homepage recommendations from Flask
export const getHomepageRecommendations = async (userId) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/recommendations/homepage', {
            user_id: userId || 'guest'
        });
        return response.data;
    } catch (error) {
        console.error('Homepage recommendations service error:', error.message);
        return { success: false, recommendations: [] };
    }
};

// Fetch PDP related recommendations from Flask
export const getPdpRecommendations = async (productId, category) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/recommendations/pdp', {
            product_id: productId,
            category: category
        });
        return response.data;
    } catch (error) {
        console.error('PDP recommendations service error:', error.message);
        return { success: false, recommendations: [] };
    }
};

// Fetch cart recommendations from Flask
export const getCartRecommendations = async (cartItems, userId) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/recommendations/cart', {
            cart_items: cartItems || [],
            user_id: userId || 'guest'
        });
        return response.data;
    } catch (error) {
        console.error('Cart recommendations service error:', error.message);
        return { success: false, recommendations: [] };
    }
};