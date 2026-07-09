from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import pandas as pd
from pymongo import MongoClient
import os
import logging
from flask_cors import CORS
from model import (
    collaborative_filtering, 
    content_based_filtering, 
    hybrid_recommendation
)

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
app.secret_key = 'your-secret-key'
logging.basicConfig(level=logging.DEBUG)
# Suppress noisy debug logs from pymongo (connection checkins, heartbeats, etc.)
logging.getLogger('pymongo').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb+srv://hyberistics7617_db_user:On7LrwaYWqMvugeN@cluster0.5od8xrz.mongodb.net/fashionverse")
DB_NAME = 'fashionverse'

# Global MongoClient cache for connection pooling
mongo_client = None

def get_mongo_client():
    global mongo_client
    if mongo_client is None:
        mongo_client = MongoClient(MONGO_URI)
    return mongo_client

# Global In-Memory DataFrames
users = None
products = None
purchases = None
browsing_history = None

def load_data_from_mongodb():
    global users, products, purchases, browsing_history
    logger.info("Connecting to MongoDB and loading data into memory...")
    
    try:
        client = get_mongo_client()
        db = client[DB_NAME]
        
        # 1. Load Users
        users_list = list(db.users.find())
        if users_list:
            users_df = pd.DataFrame(users_list)
            users_df.rename(columns={'_id': 'user_id'}, inplace=True)
            users_df['user_id'] = users_df['user_id'].astype(str)
            users = users_df[['user_id', 'name', 'email']].copy()
        else:
            users = pd.DataFrame(columns=['user_id', 'name', 'email'])
        
        # 2. Load Products
        products_list = list(db.products.find())
        if products_list:
            products_df = pd.DataFrame(products_list)
            products_df.rename(columns={'_id': 'product_id', 'name': 'product_name'}, inplace=True)
            products_df['product_id'] = products_df['product_id'].astype(str)
            
            # Populate defaults and handle missing fields
            if 'rating' not in products_df.columns:
                products_df['rating'] = 4.0
            products_df['rating'] = products_df['rating'].fillna(4.0)
            
            if 'brand' not in products_df.columns:
                products_df['brand'] = ''
            else:
                products_df['brand'] = products_df['brand'].apply(lambda x: str(x) if pd.notnull(x) else '')
                
            if 'colors' not in products_df.columns:
                products_df['colors'] = [[] for _ in range(len(products_df))]
            else:
                products_df['colors'] = products_df['colors'].apply(lambda x: x if isinstance(x, list) else [])
                
            if 'sizes' not in products_df.columns:
                products_df['sizes'] = [[] for _ in range(len(products_df))]
            else:
                products_df['sizes'] = products_df['sizes'].apply(lambda x: x if isinstance(x, list) else [])
                
            if 'price' not in products_df.columns:
                products_df['price'] = 0.0
            products_df['price'] = products_df['price'].fillna(0.0)

            # Extract the first image url for 'image_path' and ensure image lists
            def get_first_image(imgs):
                if isinstance(imgs, list) and len(imgs) > 0:
                    return imgs[0]
                return ''

            if 'images' in products_df.columns:
                products_df['image_path'] = products_df['images'].apply(get_first_image)
                products_df['images'] = products_df['images'].apply(lambda x: x if isinstance(x, list) else [])
            else:
                products_df['images'] = [[] for _ in range(len(products_df))]
                products_df['image_path'] = ''

            # Add compatibilities
            products_df['image'] = products_df['image_path']
            products_df['name'] = products_df['product_name']
            products_df['_id'] = products_df['product_id']

            products = products_df.copy()
        else:
            products = pd.DataFrame(columns=['product_id', 'product_name', 'category', 'price', 'description', 'rating', 'colors', 'sizes', 'brand', 'image_path', 'image', 'images', '_id', 'name'])
        
        # 3. Load Purchases (Orders)
        orders_list = list(db.orders.find())
        purchases_list = []
        if orders_list:
            for order in orders_list:
                user_id = order.get('user', order.get('userId', order.get('user_id', '')))
                items = order.get('items', order.get('orderItems', []))
                if isinstance(items, list):
                    for item in items:
                        product_id = item.get('product', item.get('productId', item.get('product_id', '')))
                        purchases_list.append({
                            'user_id': str(user_id),
                            'product_id': str(product_id),
                            'purchase_date': str(order.get('createdAt', '2024-01-01'))
                        })
        
        purchases_df = pd.DataFrame(purchases_list)
        if purchases_df.empty:
            purchases = pd.DataFrame(columns=['user_id', 'product_id', 'purchase_date'])
        else:
            purchases_df['user_id'] = purchases_df['user_id'].astype(str)
            purchases_df['product_id'] = purchases_df['product_id'].astype(str)
            purchases = purchases_df

        # 4. Generate Browsing History
        browsing_list = []
        if not users.empty and not products.empty:
            for _, user_row in users.iterrows():
                for _, prod_row in products.head(3).iterrows():
                    browsing_list.append({
                        'user_id': str(user_row['user_id']),
                        'product_id': str(prod_row['product_id']),
                        'browse_date': '2024-01-01'
                    })
        browsing_history = pd.DataFrame(browsing_list)
        
        # Connection is kept open in the global pool, do not close it
        logger.info(f"Successfully loaded MongoDB dataset. Users: {len(users)}, Products: {len(products)}, Purchases: {len(purchases)}")
    except Exception as err:
        logger.error(f"Error connecting to MongoDB: {str(err)}")
        raise err

# Initial Load
load_data_from_mongodb()

@app.route('/')
def index():
    return render_template('index.html', products=products.to_dict(orient='records'))

@app.route('/refresh-data', methods=['POST'])
def refresh_data():
    try:
        load_data_from_mongodb()
        return jsonify({'success': True, 'message': 'Data refreshed successfully'})
    except Exception as e:
        logger.error(f"Error refreshing dataset: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

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

def safe_serialize_df(df_or_records):
    """
    Safely converts a pandas DataFrame to a list of dicts, and replaces
    any float NaN/NaT values with Python None so that they are serialized
    as JSON null (instead of invalid NaN tokens).
    """
    if isinstance(df_or_records, pd.DataFrame):
        records = df_or_records.to_dict(orient='records')
    else:
        records = df_or_records

    def is_nan_value(v):
        if isinstance(v, (list, dict, set, tuple)):
            return False
        import numpy as np
        if isinstance(v, np.ndarray):
            return False
        return pd.isna(v)

    cleaned = []
    for record in records:
        cleaned_rec = {}
        for k, v in record.items():
            if is_nan_value(v):
                cleaned_rec[k] = None
            else:
                cleaned_rec[k] = v
        cleaned.append(cleaned_rec)
    return cleaned

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
    
    # For logged in users, if the recommendations are popular fallbacks, return empty so the frontend does not show a fake Just For You
    if user_id and user_id != 'guest':
        if not recs.empty and (recs['source'] == 'Popular').all():
            return jsonify({'success': True, 'recommendations': []})
            
    return jsonify({'success': True, 'recommendations': safe_serialize_df(recs.head(10))})

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
    
    return jsonify({'success': True, 'recommendations': safe_serialize_df(recs)})

# 3. Cart Page: Hybrid Recommendation
@app.route('/api/recommendations/cart', methods=['POST'])
def cart_recs():
    cart_items = request.json.get('cart_items', [])
    user_id = request.json.get('user_id')
    logger.debug(f"Cart Hybrid Recommendation for user_id: {user_id}, items: {cart_items}")
    
    if not user_id or user_id == 'guest':
        user_id = 'guest'
        
    recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
    
    # Filter out items already in the cart
    if not recs.empty:
        recs = recs[~recs['product_id'].isin(cart_items)].copy()
        
    recs = recs.head(4)
    return jsonify({'success': True, 'recommendations': safe_serialize_df(recs)})

# 4. Search Results & Category Page: Personalized ranking (Collaborative)
@app.route('/api/recommendations/rank', methods=['POST'])
def personalized_ranking():
    user_id = request.json.get('user_id')
    product_ids = request.json.get('product_ids', [])
    
    pool = products[products['product_id'].isin(product_ids)].copy()
    if not user_id:
        return jsonify({'success': True, 'recommendations': safe_serialize_df(pool)})
        
    user_recs = collaborative_filtering(user_id, purchases, products)
    if not user_recs.empty:
        pool = pool.merge(user_recs[['product_id', 'score']], on='product_id', how='left').fillna(0)
        pool = pool.sort_values(by='score', ascending=False)
    
    return jsonify({'success': True, 'recommendations': safe_serialize_df(pool)})

# 5. Order Confirm: Post-purchase suggest (Collaborative / Content)
@app.route('/api/recommendations/post-purchase', methods=['GET'])
def post_purchase_recs():
    user_id = request.args.get('user_id')
    recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
    return jsonify({'success': True, 'recommendations': safe_serialize_df(recs.head(5))})

if __name__ == '__main__':
    # Use gunicorn in production, debug mode locally
    import os
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
