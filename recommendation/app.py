from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import pandas as pd
from model import (
    collaborative_filtering, 
    content_based_filtering, 
    hybrid_recommendation
)
import logging
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
app.secret_key = 'your-secret-key'
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load data
users = pd.read_csv('users_expanded.csv')
products = pd.read_csv('products_expanded.csv')
product_images = pd.read_csv('product_images_expanded.csv')

# Merge images with products for easy access
products = products.merge(product_images, on='product_id', how='left')

# Add compatibility fields for frontend components
products['image'] = products['image_path']
products['images'] = products['image_path'].apply(lambda x: [x] if pd.notnull(x) else [])
products['name'] = products['product_name']
products['_id'] = products['product_id']


purchases = pd.read_csv('purchases_expanded.csv')
browsing_history = pd.read_csv('browsing_history_expanded.csv')

@app.route('/')
def index():
    return render_template('index.html', products=products.to_dict(orient='records'))

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        user_id = request.form.get('user_id')
        user_id = str(user_id)
        algorithm = request.form['algorithm']
        logger.debug(f"Processing request for user_id: {user_id}, algorithm: {algorithm}")
        users['user_id'] = users['user_id'].astype(str)
        purchases['user_id'] = purchases['user_id'].astype(str)
        browsing_history['user_id'] = browsing_history['user_id'].astype(str)

        if user_id not in users['user_id'].values:
            flash('User ID not found!')
            return redirect(url_for('index'))

        # Get interacted products
        purchased_product_ids = purchases[purchases['user_id'] == user_id]['product_id'].unique()
        browsed_product_ids = browsing_history[browsing_history['user_id'] == user_id]['product_id'].unique()
        interacted_products = products[products['product_id'].isin(purchased_product_ids) | 
                                      products['product_id'].isin(browsed_product_ids)].copy()
        interacted_products['source'] = interacted_products['product_id'].apply(
            lambda x: 'Purchased' if x in purchased_product_ids else 'Browsed'
        )
        logger.debug(f"Interacted products: {interacted_products['product_id'].tolist()}")

        # Generate recommendations
        if algorithm == 'collaborative':
            recommendations = collaborative_filtering(user_id, purchases, products)
        elif algorithm == 'content-based':
            recommendations = content_based_filtering(user_id, purchases, browsing_history, products)
        elif algorithm == 'hybrid':
            recommendations = hybrid_recommendation(user_id, purchases, browsing_history, products)
        else:
            flash('Invalid algorithm selected!')
            return redirect(url_for('index'))

        # Filter out interacted products
        recommended_products = recommendations[~recommendations['product_id'].isin(purchased_product_ids) & 
                                               ~recommendations['product_id'].isin(browsed_product_ids)].copy()
        logger.debug(f"Filtered recommendations:\n{recommended_products[['product_id', 'score', 'source']]}")

        if recommended_products.empty:
            flash('No recommendations available for this user.')

        return render_template('recommendations.html', 
                             interacted_products=interacted_products.to_dict(orient='records'),
                             recommended_products=recommended_products.to_dict(orient='records'))
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        flash(f'An error occurred: {str(e)}')
        return redirect(url_for('index'))

# 1. Homepage: Trending / Personalized (Hybrid)
@app.route('/api/recommendations/homepage', methods=['GET', 'POST'])
def homepage_recs():
    user_id = None
    if request.method == 'POST':
        user_id = request.json.get('user_id')
    else:
        user_id = request.args.get('user_id')
    
    logger.debug(f"Homepage recs for user_id: {user_id}")
    recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
    
    # If the recommendations returned are entirely from the "Popular" fallback
    # it means the user has no history. For logged in users, we return empty
    # so the frontend doesn't show a fake "Just for You" section.
    if user_id and user_id != 'guest':
        if not recs.empty and (recs['source'] == 'Popular').all():
            return jsonify({'success': True, 'recommendations': []})
            
    return jsonify({'success': True, 'recommendations': recs.head(10).to_dict(orient='records')})

# 2. Product Page (PDP): Content-Based Filtering
@app.route('/api/recommendations/pdp', methods=['POST'])
@app.route('/api/recommendations/pdp/<product_id>', methods=['GET'])
def pdp_recs(product_id=None):
    if request.method == 'POST':
        product_id = request.json.get('product_id')
    
    logger.debug(f"PDP Content-Based Filtering for product_id: {product_id}")
    target_product = products[products['product_id'] == product_id]
    if target_product.empty:
        return jsonify({'success': True, 'recommendations': []})
    
    category = target_product.iloc[0]['category']
    # Content-based attribute matching (category)
    recs = products[(products['category'] == category) & (products['product_id'] != product_id)].copy()
    recs['score'] = recs['rating'] / 5.0
    recs['source'] = 'Content-Based Filtering'
    recs = recs.sort_values(by='score', ascending=False).head(6)
    
    return jsonify({'success': True, 'recommendations': recs.to_dict(orient='records')})

# 3. Cart Page: Hybrid Recommendation
@app.route('/api/recommendations/cart', methods=['POST'])
def cart_recs():
    cart_items = request.json.get('cart_items', [])
    user_id = request.json.get('user_id')
    logger.debug(f"Cart Hybrid Recommendation for user_id: {user_id}, items: {cart_items}")
    
    # Run hybrid recommendation for user (falls back to popular items for guest)
    if not user_id or user_id == 'guest':
        user_id = 'guest'
        
    recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
    
    # Filter out items already in the cart
    if not recs.empty:
        recs = recs[~recs['product_id'].isin(cart_items)].copy()
        
    recs = recs.head(4)
    return jsonify({'success': True, 'recommendations': recs.to_dict(orient='records')})

# 4. Search Results & Category Page: Personalized ranking (Collaborative)
@app.route('/api/recommendations/rank', methods=['POST'])
def personalized_ranking():
    user_id = request.json.get('user_id')
    product_ids = request.json.get('product_ids', [])
    
    pool = products[products['product_id'].isin(product_ids)].copy()
    if not user_id:
        return jsonify({'success': True, 'recommendations': pool.to_dict(orient='records')})
        
    user_recs = collaborative_filtering(user_id, purchases, products)
    if not user_recs.empty:
        pool = pool.merge(user_recs[['product_id', 'score']], on='product_id', how='left').fillna(0)
        pool = pool.sort_values(by='score', ascending=False)
    
    return jsonify({'success': True, 'recommendations': pool.to_dict(orient='records')})

# 5. Order Confirm: Post-purchase suggest (Collaborative / Content)
@app.route('/api/recommendations/post-purchase', methods=['GET'])
def post_purchase_recs():
    user_id = request.args.get('user_id')
    recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
    return jsonify({'success': True, 'recommendations': recs.head(5).to_dict(orient='records')})

if __name__ == '__main__':
    # Use gunicorn in production, debug mode locally
    import os
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
