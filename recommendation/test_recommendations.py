import pandas as pd
from model import (
    collaborative_filtering, 
    content_based_filtering, 
    hybrid_recommendation
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_user_recs():
    print("="*60)
    print("TESTING FASHIONVERSE RECOMMENDATION SYSTEM")
    print("="*60)

    # Load local data
    users = pd.read_csv('users_expanded.csv')
    products = pd.read_csv('products_expanded.csv')
    purchases = pd.read_csv('purchases_expanded.csv')
    browsing_history = pd.read_csv('browsing_history_expanded.csv')

    # Convert user IDs to strings
    users['user_id'] = users['user_id'].astype(str)
    purchases['user_id'] = purchases['user_id'].astype(str)
    browsing_history['user_id'] = browsing_history['user_id'].astype(str)

    # Let's find some dummy users
    dummy_users = users[users['email'].str.endswith('@fashionverse.com', na=False)]
    if dummy_users.empty:
        print("No dummy users found!")
        return

    print(f"Total users: {len(users)} ({len(dummy_users)} dummy users)")
    print(f"Total products: {len(products)}")
    print(f"Total purchases: {len(purchases)}")
    print(f"Total browsing history: {len(browsing_history)}")
    print("-" * 60)

    # Let's pick 3 dummy users (one from each cluster)
    # 1. Ali Khan (should be in Group 1 - Women)
    # 2. Hania Amir (should be in Group 2 - Men)
    # 3. Saad Rehman (should be in Group 3 - Kids)
    test_emails = [
        "ali.khan@fashionverse.com",
        "hania.amir@fashionverse.com",
        "saad.rehman@fashionverse.com"
    ]

    for email in test_emails:
        user_row = dummy_users[dummy_users['email'] == email]
        if user_row.empty:
            continue
            
        user_id = str(user_row.iloc[0]['user_id'])
        user_name = user_row.iloc[0]['name']
        
        print(f"\nUser: {user_name} (ID: {user_id}, Email: {email})")
        
        # Display their actual purchases
        user_purchases_ids = purchases[purchases['user_id'] == user_id]['product_id'].unique()
        user_purchases_names = products[products['product_id'].isin(user_purchases_ids)]['product_name'].tolist()
        print(f"  Purchased products: {user_purchases_names}")
        
        # Display their browsing history
        user_browsed_ids = browsing_history[browsing_history['user_id'] == user_id]['product_id'].unique()
        user_browsed_names = products[products['product_id'].isin(user_browsed_ids)]['product_name'].tolist()
        print(f"  Browsed products: {user_browsed_names}")
        
        # 1. Collaborative Filtering Recommendations
        print("\n  [1] Collaborative Filtering Recommendations:")
        collab_recs = collaborative_filtering(user_id, purchases, products)
        collab_recs = collab_recs[~collab_recs['product_id'].isin(user_purchases_ids) & 
                                  ~collab_recs['product_id'].isin(user_browsed_ids)].head(3)
        if collab_recs.empty:
            print("    No collaborative recommendations.")
        else:
            for idx, row in collab_recs.iterrows():
                print(f"    - {row['product_name']} ({row['category']}) | Score: {row['score']:.3f}")

        # 2. Content-Based Filtering Recommendations
        print("\n  [2] Content-Based Filtering Recommendations:")
        content_recs = content_based_filtering(user_id, purchases, browsing_history, products)
        content_recs = content_recs[~content_recs['product_id'].isin(user_purchases_ids) & 
                                    ~content_recs['product_id'].isin(user_browsed_ids)].head(3)
        if content_recs.empty:
            print("    No content-based recommendations.")
        else:
            for idx, row in content_recs.iterrows():
                print(f"    - {row['product_name']} ({row['category']}) | Score: {row['score']:.3f}")

        # 3. Hybrid Recommendations
        print("\n  [3] Hybrid Recommendations:")
        hybrid_recs = hybrid_recommendation(user_id, purchases, browsing_history, products)
        hybrid_recs = hybrid_recs[~hybrid_recs['product_id'].isin(user_purchases_ids) & 
                                  ~hybrid_recs['product_id'].isin(user_browsed_ids)].head(5)
        if hybrid_recs.empty:
            print("    No hybrid recommendations.")
        else:
            for idx, row in hybrid_recs.iterrows():
                print(f"    - {row['product_name']} ({row['category']}) | Score: {row['score']:.3f} | Source: {row['source']}")
                
        print("-" * 60)

if __name__ == '__main__':
    test_user_recs()
