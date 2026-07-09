import pandas as pd
import numpy as np
import logging

logging.basicConfig(level=logging.DEBUG)
# Suppress noisy debug logs from pymongo (connection checkins, heartbeats, etc.)
logging.getLogger('pymongo').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

def get_cold_start_recommendations(purchases, products, limit=10):
    """
    Generates non-personalized fallback recommendations for new users.
    Combines:
    - Best Sellers (most purchased products)
    - Highly Rated products (rating >= 4.0)
    - New Arrivals (newest added products)
    """
    logger.debug("Generating Cold Start recommendations...")
    if products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # 1. Best Sellers
    best_sellers = pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])
    if not purchases.empty and 'product_id' in purchases.columns:
        purchase_counts = purchases['product_id'].value_counts()
        if not purchase_counts.empty:
            top_selling_ids = purchase_counts.head(limit).index.tolist()
            best_sellers = products[products['product_id'].isin(top_selling_ids)].copy()
            best_sellers['score'] = best_sellers['product_id'].map(purchase_counts)
            # Normalize scores
            max_p = purchase_counts.max()
            best_sellers['score'] = best_sellers['score'] / (max_p if max_p > 0 else 1.0)
            best_sellers['source'] = 'Best Seller'

    # 2. Highly Rated
    highly_rated = products.sort_values(by='rating', ascending=False).head(limit).copy()
    highly_rated['score'] = highly_rated['rating'] / 5.0
    highly_rated['source'] = 'Highly Rated'

    # 3. New Arrivals (sort by product_id or index descending)
    new_arrivals = products.tail(limit).copy()
    new_arrivals['score'] = 0.7
    new_arrivals['source'] = 'New Arrival'

    # Combine all
    combined = pd.concat([best_sellers, highly_rated, new_arrivals], ignore_index=True)
    # Drop duplicates keeping the highest score source
    combined = combined.sort_values(by='score', ascending=False)
    combined = combined.drop_duplicates(subset=['product_id'], keep='first')

    return combined.head(limit)

def collaborative_filtering(user_id, purchases, products):
    """
    Collaborative filtering based on Jaccard User-to-User similarity.
    Recommends products purchased by users with similar purchase history.
    """
    logger.debug(f"Collaborative Filtering for user_id: {user_id}")
    if not user_id or str(user_id) == 'guest' or purchases.empty or products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    uid = str(user_id)
    
    # 1. Get products purchased by the target user
    user_purchases = purchases[purchases['user_id'] == uid]['product_id'].unique()
    if len(user_purchases) == 0:
        logger.debug(f"User {uid} has no purchase history for Collaborative Filtering.")
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    target_purchase_set = set(user_purchases)

    # 2. Get purchase lists of all other users
    other_purchases = purchases[purchases['user_id'] != uid]
    if other_purchases.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    other_user_purchases = other_purchases.groupby('user_id')['product_id'].apply(set).to_dict()

    # 3. Compute Jaccard similarities
    user_similarities = {}
    for other_uid, other_set in other_user_purchases.items():
        intersection = len(target_purchase_set.intersection(other_set))
        union = len(target_purchase_set.union(other_set))
        if union > 0 and intersection > 0:
            user_similarities[other_uid] = intersection / union

    if not user_similarities:
        logger.debug(f"No similar users found for user {uid}.")
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # 4. Score products purchased by similar users (excluding target user's purchased items)
    candidate_products = products[~products['product_id'].isin(target_purchase_set)].copy()
    if candidate_products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # Group other purchases by product to quickly get who bought what
    product_buyers = other_purchases.groupby('product_id')['user_id'].apply(list).to_dict()

    def calc_collab_score(row):
        pid = row['product_id']
        buyers = product_buyers.get(pid, [])
        if not buyers:
            return 0.0
        
        # Sum similarity weights of users who bought this product
        weight_sum = sum(user_similarities.get(buyer, 0.0) for buyer in buyers)
        rating = float(row.get('rating', 4.0))
        return weight_sum * (rating / 5.0)

    candidate_products['score'] = candidate_products.apply(calc_collab_score, axis=1)
    
    # Filter non-zero scores
    candidate_products = candidate_products[candidate_products['score'] > 0.0].copy()
    if candidate_products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # Normalize scores between 0 and 1
    max_score = candidate_products['score'].max()
    if max_score > 0:
        candidate_products['score'] = candidate_products['score'] / max_score

    candidate_products['source'] = 'Collaborative Filtering'
    return candidate_products.sort_values(by='score', ascending=False)

def content_based_filtering(user_id, purchases, browsing_history, products):
    """
    Content-Based filtering based on product attributes:
    - Same Category (+0.4)
    - Same Brand (+0.3)
    - Colors overlap (+0.2 Jaccard)
    - Price range similarity (+0.1)
    Calculates similarity between candidate products and user history.
    """
    logger.debug(f"Content-Based Filtering for user_id: {user_id}")
    if not user_id or str(user_id) == 'guest' or products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    uid = str(user_id)

    # 1. Gather user's history (purchased + browsed)
    user_purchases = purchases[purchases['user_id'] == uid]['product_id'].unique() if not purchases.empty else []
    # If the user has real purchases, we ignore the mock/fallback browsing history to avoid contamination
    if len(user_purchases) > 0:
        user_history_ids = set(user_purchases)
    else:
        user_browsed = browsing_history[browsing_history['user_id'] == uid]['product_id'].unique() if not browsing_history.empty else []
        user_history_ids = set(user_browsed)

    if len(user_history_ids) == 0:
        logger.debug(f"User {uid} has no purchase or browse history for Content-Based Filtering.")
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # 2. Get history products
    history_products = products[products['product_id'].isin(user_history_ids)].copy()
    candidate_products = products[~products['product_id'].isin(user_history_ids)].copy()

    if history_products.empty or candidate_products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    history_records = history_products.to_dict('records')

    # 3. Score candidate products
    def calc_content_similarity(row):
        max_sim = 0.0
        row_cat = row.get('category', '')
        row_brand = str(row.get('brand', ''))
        row_colors = row.get('colors', [])
        if not isinstance(row_colors, list):
            row_colors = []
        row_price = float(row.get('price', 0.0))

        for h in history_records:
            sim = 0.0
            # Category match
            if row_cat and row_cat == h.get('category', ''):
                sim += 0.4
            
            # Brand match
            h_brand = str(h.get('brand', ''))
            if row_brand and h_brand and row_brand == h_brand:
                sim += 0.3
            
            # Colors match (Jaccard similarity on colors list)
            h_colors = h.get('colors', [])
            if not isinstance(h_colors, list):
                h_colors = []
            if row_colors and h_colors:
                intersection = set(row_colors).intersection(h_colors)
                union = set(row_colors).union(h_colors)
                if union:
                    sim += 0.2 * (len(intersection) / len(union))
            
            # Price match (relative difference weight)
            h_price = float(h.get('price', 0.0))
            max_p = max(row_price, h_price, 1.0)
            sim += 0.1 * (1.0 - abs(row_price - h_price) / max_p)

            if sim > max_sim:
                max_sim = sim

        rating = float(row.get('rating', 4.0))
        return max_sim * (rating / 5.0)

    candidate_products['score'] = candidate_products.apply(calc_content_similarity, axis=1)

    # Filter non-zero scores
    candidate_products = candidate_products[candidate_products['score'] > 0.0].copy()
    if candidate_products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    # Normalize
    max_score = candidate_products['score'].max()
    if max_score > 0:
        candidate_products['score'] = candidate_products['score'] / max_score

    candidate_products['source'] = 'Content-Based Filtering'
    return candidate_products.sort_values(by='score', ascending=False)

def hybrid_recommendation(user_id, purchases, browsing_history, products):
    """
    Intelligent Hybrid Recommendation Logic:
    - New User (0 purchases) -> Popular / Trending / Best Sellers (Cold Start)
    - Existing User (1+ purchases) -> Collaborative Filtering + Content-Based Filtering
    - Dynamic Weighting: Adjust weights based on data availability
    - Fallback: Append Popular/Trending items if results are sparse or weak.
    """
    logger.debug(f"Hybrid Recommendation for user_id: {user_id}")
    if products.empty:
        return pd.DataFrame(columns=products.columns.tolist() + ['score', 'source'])

    uid = str(user_id)

    # 1. Cold Start handling (New Users with 0 purchases)
    user_purchases = purchases[purchases['user_id'] == uid]['product_id'].unique() if not purchases.empty else []
    
    if len(user_purchases) == 0 or uid == 'guest':
        logger.debug(f"Cold Start user detected: {uid}. Using popular / trending products.")
        return get_cold_start_recommendations(purchases, products, limit=10)

    # 2. Get Collaborative and Content-based recommendations
    collab_recs = collaborative_filtering(uid, purchases, products)
    content_recs = content_based_filtering(uid, purchases, browsing_history, products)

    # 3. Dynamic Weighting
    # If collaborative filtering has very sparse items (e.g. fewer than 3), shift weight to Content-Based
    if collab_recs.empty or len(collab_recs) < 3:
        logger.debug("Collaborative Filtering has insufficient data. Shifting weight to Content-Based.")
        w_collab = 0.0
        w_content = 1.0
    else:
        w_collab = 0.5
        w_content = 0.5

    # 4. Merge scores
    collab_scores = collab_recs[['product_id', 'score']].rename(columns={'score': 'collab_score'})
    content_scores = content_recs[['product_id', 'score']].rename(columns={'score': 'content_score'})

    merged = products.merge(collab_scores, on='product_id', how='left')
    merged = merged.merge(content_scores, on='product_id', how='left')
    
    merged['collab_score'] = merged['collab_score'].fillna(0.0)
    merged['content_score'] = merged['content_score'].fillna(0.0)
    
    merged['score'] = (w_collab * merged['collab_score']) + (w_content * merged['content_score'])

    # Determine dynamic source tag
    def get_source_label(row):
        if row['collab_score'] > 0 and row['content_score'] > 0:
            return 'Hybrid Recommendation'
        elif row['collab_score'] > 0:
            return 'Collaborative Filtering'
        elif row['content_score'] > 0:
            return 'Content-Based Filtering'
        return 'Popular'

    merged['source'] = merged.apply(get_source_label, axis=1)

    # Filter out items that the user has already interacted with (purchased, or browsed if no purchases exist)
    if len(user_purchases) > 0:
        user_history_ids = set(user_purchases)
    else:
        user_browsed = browsing_history[browsing_history['user_id'] == uid]['product_id'].unique() if not browsing_history.empty else []
        user_history_ids = set(user_browsed)
    
    hybrid_recs = merged[~merged['product_id'].isin(user_history_ids)].copy()
    hybrid_recs = hybrid_recs[hybrid_recs['score'] > 0.0].sort_values(by='score', ascending=False)

    # 5. Weak results fallback
    # If total hybrid recommendations is sparse, fill with cold-start products
    if len(hybrid_recs) < 10:
        logger.debug("Hybrid recommendations are sparse. Appending cold start products as fallback.")
        cold_start = get_cold_start_recommendations(purchases, products, limit=15)
        
        # Filter out user history and already recommended products
        cold_start = cold_start[~cold_start['product_id'].isin(user_history_ids)]
        cold_start = cold_start[~cold_start['product_id'].isin(hybrid_recs['product_id'])]
        
        hybrid_recs = pd.concat([hybrid_recs, cold_start], ignore_index=True)

    return hybrid_recs.head(10)
