import pandas as pd
import numpy as np
import random
import os
import sys
from datetime import datetime, timedelta

# Try importing pymongo for MongoDB operations
try:
    from pymongo import MongoClient
    from bson.objectid import ObjectId
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

# MongoDB Connection String (from server/.env and mongodb_to_csv.py)
MONGO_URI = 'mongodb+srv://hyberistics7617_db_user:On7LrwaYWqMvugeN@cluster0.5od8xrz.mongodb.net/fashionverse'
DB_NAME = 'fashionverse'

# ----------------- DUMMY DATA DEFINITIONS -----------------
# 20 Dummy Users with Pakistani names and matching emails
DUMMY_USERS_DATA = [
    {"name": "Ali Khan", "email": "ali.khan@fashionverse.com"},
    {"name": "Ayesha Ahmed", "email": "ayesha.ahmed@fashionverse.com"},
    {"name": "Hamza Bilal", "email": "hamza.bilal@fashionverse.com"},
    {"name": "Fatima Sana", "email": "fatima.sana@fashionverse.com"},
    {"name": "Zainab Raza", "email": "zainab.raza@fashionverse.com"},
    {"name": "Muhammad Bilal", "email": "muhammad.bilal@fashionverse.com"},
    {"name": "Sara Yousuf", "email": "sara.yousuf@fashionverse.com"},
    {"name": "Bilal Siddiqui", "email": "bilal.siddiqui@fashionverse.com"},
    {"name": "Hania Amir", "email": "hania.amir@fashionverse.com"},
    {"name": "Usman Tariq", "email": "usman.tariq@fashionverse.com"},
    {"name": "Mahnoor Malik", "email": "mahnoor.malik@fashionverse.com"},
    {"name": "Zain Abbas", "email": "zain.abbas@fashionverse.com"},
    {"name": "Anam Sheikh", "email": "anam.sheikh@fashionverse.com"},
    {"name": "Haris Rauf", "email": "haris.rauf@fashionverse.com"},
    {"name": "Sana Javed", "email": "sana.javed@fashionverse.com"},
    {"name": "Saad Rehman", "email": "saad.rehman@fashionverse.com"},
    {"name": "Eshal Noor", "email": "eshal.noor@fashionverse.com"},
    {"name": "Fahad Mustafa", "email": "fahad.mustafa@fashionverse.com"},
    {"name": "Kiran Naz", "email": "kiran.naz@fashionverse.com"},
    {"name": "Waseem Akram", "email": "waseem.akram@fashionverse.com"},
]

# Sample reviews/comments to inject for products
PRODUCT_COMMENTS = {
    "high": [
        "Amazing quality fabric! Highly recommend it.",
        "Fits perfectly and the color is gorgeous.",
        "Premium stitching and very comfortable to wear.",
        "Absolutely loved it. Worth every rupee!",
        "Excellent quality product. Will definitely buy again."
    ],
    "medium": [
        "Fabric is decent, good for daily use.",
        "Stitching is okay, color is slightly lighter than picture.",
        "Good value for money.",
        "Standard quality and size fits fine.",
        "Average stitching but comfortable wash and wear."
    ],
    "low": [
        "Fabric quality is average, could have been better.",
        "Stitching was a bit loose, had to get it repaired.",
        "Price is slightly high for this quality."
    ]
}

def get_comment_for_rating(rating):
    if rating >= 4.3:
        return random.choice(PRODUCT_COMMENTS["high"])
    elif rating >= 3.7:
        return random.choice(PRODUCT_COMMENTS["medium"])
    else:
        return random.choice(PRODUCT_COMMENTS["low"])

def generate_pakistani_address():
    streets = ["Street 3, Phase 6, DHA", "Main Boulevard, Gulberg III", "Johar Town Block H-3", "F-8/3, Street 12", "Samanabad Area near Roundabout"]
    cities = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Rawalpindi"]
    return {
        "address": random.choice(streets),
        "city": random.choice(cities),
        "state": "Punjab",
        "zipCode": str(random.randint(44000, 54000)),
        "country": "Pakistan"
    }

# ----------------- MONGO DB SEEDING FUNCTION -----------------
def seed_mongodb():
    if not MONGO_AVAILABLE:
        print("[WARNING] PyMongo not installed. Skipping MongoDB database seed.")
        return False

    print("Connecting to MongoDB Atlas...")
    try:
        # 5-second timeout for quick connection check
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Test connection
        client.server_info()
        print("[SUCCESS] Connected to MongoDB successfully!")

        # 1. Update Product Ratings and add Reviews in MongoDB
        products_col = db.products
        db_products = list(products_col.find({"isActive": True}))
        if not db_products:
            print("[WARNING] No active products found in MongoDB. Checking all products...")
            db_products = list(products_col.find())
        
        if not db_products:
            print("[ERROR] No products found in MongoDB collection. Cannot update products.")
            return False
            
        print(f"Updating {len(db_products)} products with diverse ratings and reviews...")
        
        product_list_for_seeding = []
        for prod in db_products:
            prod_id = prod["_id"]
            # Generate diverse rating
            new_rating = round(random.uniform(3.4, 4.9), 1)
            
            # Generate 2 to 4 random reviews
            reviews = []
            num_reviews = random.randint(2, 4)
            for _ in range(num_reviews):
                rev_rating = round(new_rating + random.uniform(-0.5, 0.5), 1)
                rev_rating = max(1.0, min(5.0, rev_rating))
                comment = get_comment_for_rating(rev_rating)
                reviews.append({
                    "title": "Verified Purchase Review",
                    "comment": comment,
                    "rating": rev_rating,
                    "createdAt": datetime.now() - timedelta(days=random.randint(1, 30))
                })
            
            # Update in MongoDB
            products_col.update_one(
                {"_id": prod_id},
                {"$set": {"rating": new_rating, "reviews": reviews}}
            )
            product_list_for_seeding.append({
                "_id": prod_id,
                "category": prod.get("category", "Women"),
                "price": prod.get("price", 3000)
            })
        print("[SUCCESS] Products ratings and reviews updated in MongoDB!")

        # 2. Delete existing dummy users from MongoDB
        users_col = db.users
        delete_users_res = users_col.delete_many({"email": {"$regex": "@fashionverse\\.com$"}})
        print(f"[CLEANUP] Cleaned up {delete_users_res.deleted_count} previous dummy users from database.")

        # 3. Insert 20 Dummy Users into MongoDB
        print("Inserting 20 dummy users...")
        inserted_user_ids = []
        # Pre-hashed bcrypt password for "password123"
        hashed_password = "$2a$12$R9h/lIPzNgb.O7.D1B8rO.qN.B1s0JNz.YdM0d8G9J4j6E.rY7/Xq"
        
        for u in DUMMY_USERS_DATA:
            user_doc = {
                "name": u["name"],
                "email": u["email"],
                "username": u["email"].split("@")[0].replace(".", "_"),
                "password": hashed_password,
                "role": "customer",
                "phone": "+923" + "".join([str(random.randint(0, 9)) for _ in range(9)]),
                "location": "Lahore, Pakistan",
                "bio": "Fashion enthusiast who loves modern designs.",
                "createdAt": datetime.now() - timedelta(days=random.randint(30, 90)),
                "updatedAt": datetime.now()
            }
            res = users_col.insert_one(user_doc)
            inserted_user_ids.append((str(res.inserted_id), u["name"]))
            
        print("[SUCCESS] Successfully created 20 dummy users in database!")

        # 4. Distribute Users into 3 Interest Groups and Create Orders & Browsing history
        # Let's map our products by category
        products_by_cat = {}
        for p in product_list_for_seeding:
            cat = p["category"]
            if cat not in products_by_cat:
                products_by_cat[cat] = []
            products_by_cat[cat].append(p)
            
        # Ensure we have fallback if some categories are missing in DB
        all_cats = list(products_by_cat.keys())
        if not all_cats:
            print("[ERROR] No products categorized. Cannot generate orders.")
            return False

        print("Generating structured cluster-based orders (purchases) in MongoDB...")
        
        # Divide our 20 users into 3 clusters
        # Group 1: Women's Wear Fans (Indices 0 to 7)
        # Group 2: Men's Wear Fans (Indices 8 to 14)
        # Group 3: Kids' Wear Fans (Indices 15 to 19)
        
        user_clusters = {
            "Women": inserted_user_ids[0:8],
            "Men": inserted_user_ids[8:15],
            "Kids": inserted_user_ids[15:20]
        }

        # Clear old orders for these dummy users (just in case)
        orders_col = db.orders
        dummy_uids = [ObjectId(uid) for uid, _ in inserted_user_ids]
        delete_orders_res = orders_col.delete_many({"userId": {"$in": dummy_uids}})
        print(f"[CLEANUP] Cleaned up {delete_orders_res.deleted_count} previous dummy orders from database.")

        orders_seeded_count = 0
        
        # We want to seed around 60-80 purchases total (orders can contain multiple products)
        for cat, users_in_cluster in user_clusters.items():
            # Get products in this category, fallback to any product if category empty
            cat_products = products_by_cat.get(cat, product_list_for_seeding)
            if not cat_products:
                cat_products = product_list_for_seeding
                
            hot_products = cat_products[:min(2, len(cat_products))]
            remaining_products = cat_products[min(2, len(cat_products)):]
            
            for user_id_str, user_name in users_in_cluster:
                # Number of orders for this user
                num_user_orders = random.randint(2, 4)
                
                for _ in range(num_user_orders):
                    # Select items
                    items = []
                    # 75% chance to buy at least one hot product to ensure collaborative overlap!
                    purchased_products = []
                    if random.random() < 0.75 and hot_products:
                        purchased_products.append(random.choice(hot_products))
                    
                    # Add 1-2 other random products from their category
                    num_other_items = random.randint(1, 2)
                    if remaining_products:
                        for p in random.sample(remaining_products, min(num_other_items, len(remaining_products))):
                            if p not in purchased_products:
                                purchased_products.append(p)
                                
                    # 15% chance to buy a product outside their main cluster (cross-group interactions)
                    if random.random() < 0.15 and len(all_cats) > 1:
                        other_cat = random.choice([c for c in all_cats if c != cat])
                        other_cat_prods = products_by_cat.get(other_cat, product_list_for_seeding)
                        if other_cat_prods:
                            purchased_products.append(random.choice(other_cat_prods))
                            
                    # Construct order items array
                    total_amount = 0
                    for p in purchased_products:
                        qty = random.randint(1, 2)
                        price = p["price"]
                        items.append({
                            "productId": p["_id"],
                            "quantity": qty,
                            "price": price
                        })
                        total_amount += price * qty
                        
                    if not items:
                        continue
                        
                    # Construct order doc
                    addr = generate_pakistani_address()
                    order_doc = {
                        "userId": ObjectId(user_id_str),
                        "items": items,
                        "totalAmount": total_amount,
                        "shippingAddress": {
                            "name": user_name,
                            "phone": "+923" + "".join([str(random.randint(0, 9)) for _ in range(9)]),
                            **addr
                        },
                        "paymentMethod": random.choice(['credit_card', 'debit_card']),
                        "paymentStatus": "completed",
                        "orderStatus": random.choice(['delivered', 'processing']),
                        "createdAt": datetime.now() - timedelta(days=random.randint(1, 25)),
                        "updatedAt": datetime.now()
                    }
                    orders_col.insert_one(order_doc)
                    orders_seeded_count += 1
                    
        print(f"[SUCCESS] Created {orders_seeded_count} rich, clustered orders in MongoDB!")
        client.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to seed MongoDB: {e}")
        return False

# ----------------- LOCAL CSV SYNC / EXPORT FUNCTION -----------------
def sync_mongodb_to_csv():
    """Reads MongoDB and updates all local recommendation CSV files"""
    print("\nSynchronizing MongoDB Data to local CSV files...")
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # 1. Export Users
        users = pd.DataFrame(list(db.users.find()))
        if not users.empty:
            users = users[['_id', 'name', 'email']].copy()
            users.rename(columns={'_id': 'user_id'}, inplace=True)
            users['user_id'] = users['user_id'].astype(str)
            users.to_csv('users_expanded.csv', index=False)
            print(f"[SUCCESS] users_expanded.csv updated: {len(users)} records")
        
        # 2. Export Products
        products = pd.DataFrame(list(db.products.find()))
        if not products.empty:
            available_cols = ['_id', 'name', 'category', 'price', 'description', 'rating']
            existing_cols = [c for c in available_cols if c in products.columns]
            products = products[existing_cols].copy()
            products.rename(columns={'_id': 'product_id', 'name': 'product_name'}, inplace=True)
            products['product_id'] = products['product_id'].astype(str)
            products.to_csv('products_expanded.csv', index=False)
            print(f"[SUCCESS] products_expanded.csv updated: {len(products)} records")
            
        # 3. Export Product Images
        product_images_list = []
        products_raw = list(db.products.find())
        for product in products_raw:
            images = product.get('images', [])
            image_url = images[0] if isinstance(images, list) and len(images) > 0 else ''
            product_images_list.append({
                'product_id': str(product['_id']),
                'image_path': image_url
            })
        product_images_df = pd.DataFrame(product_images_list)
        product_images_df.to_csv('product_images_expanded.csv', index=False)
        print(f"[SUCCESS] product_images_expanded.csv updated: {len(product_images_df)} records")

        # 4. Export Purchases (Orders)
        orders = list(db.orders.find())
        purchases = []
        for order in orders:
            user_id = order.get('userId', order.get('user', ''))
            items = order.get('items', [])
            createdAt = order.get('createdAt', '2026-01-01')
            if isinstance(items, list):
                for item in items:
                    prod_id = item.get('productId', '')
                    purchases.append({
                        'user_id': str(user_id),
                        'product_id': str(prod_id),
                        'purchase_date': str(createdAt)
                    })
        purchases_df = pd.DataFrame(purchases)
        if not purchases_df.empty:
            purchases_df.to_csv('purchases_expanded.csv', index=False)
            print(f"[SUCCESS] purchases_expanded.csv updated: {len(purchases_df)} records")

        # 5. Generate and Export Browsing History
        print("Generating rich browsing history from updated purchases...")
        browsing = []
        
        # Load local products and purchases to make sure they are aligned
        local_users = pd.read_csv('users_expanded.csv')
        local_products = pd.read_csv('products_expanded.csv')
        local_purchases = pd.read_csv('purchases_expanded.csv')
        
        user_purchases_map = local_purchases.groupby('user_id')['product_id'].apply(list).to_dict()
        
        for _, user in local_users.iterrows():
            u_id = str(user['user_id'])
            user_purchased = user_purchases_map.get(u_id, [])
            
            preferred_categories = []
            if user_purchased:
                pref_cats = local_products[local_products['product_id'].isin(user_purchased)]['category'].tolist()
                preferred_categories = list(set(pref_cats))
            
            if not preferred_categories:
                preferred_categories = [random.choice(local_products['category'].unique())]
                
            pref_products = local_products[local_products['category'].isin(preferred_categories)]['product_id'].tolist()
            
            # 1. Browse what they purchased (85% chance for each purchase)
            for p_id in user_purchased:
                if random.random() < 0.85:
                    browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            # 2. Browse other items in the same categories (3-6 additional browses)
            num_browses = random.randint(3, 6)
            other_prods = [p for p in pref_products if p not in user_purchased]
            if other_prods:
                selected_prods = random.sample(other_prods, min(num_browses, len(other_prods)))
                for p_id in selected_prods:
                    browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })
                    
            # 3. Add a few browses in other categories for exploration
            explore_prods = local_products[~local_products['category'].isin(preferred_categories)]['product_id'].tolist()
            if explore_prods and random.random() < 0.4:
                explore_selected = random.sample(explore_prods, min(2, len(explore_prods)))
                for p_id in explore_selected:
                    browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })
                    
        browsing_df = pd.DataFrame(browsing)
        browsing_df.to_csv('browsing_history_expanded.csv', index=False)
        print(f"[SUCCESS] browsing_history_expanded.csv updated: {len(browsing_df)} records")
        
        client.close()
        print("[SUCCESS] MONGO-TO-CSV SYNC COMPLETED SUCCESSFULLY!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to sync MongoDB to CSV: {e}")
        return False

# ----------------- OFFLINE LOCAL CSV FALLBACK SEEDER -----------------
def seed_offline_local_csv():
    print("\n[WARNING] Running Offline Local CSV Data Seeding...")
    try:
        # Check if CSV files exist
        if not os.path.exists('products_expanded.csv'):
            print("[ERROR] products_expanded.csv not found. Cannot proceed offline.")
            return False
            
        # 1. Update Products Rating with realistic distribution
        products = pd.read_csv('products_expanded.csv')
        print(f"Updating {len(products)} products with diverse ratings in CSV...")
        ratings = [round(random.uniform(3.4, 4.9), 1) for _ in range(len(products))]
        products['rating'] = ratings
        products.to_csv('products_expanded.csv', index=False)
        print("[SUCCESS] products_expanded.csv ratings updated!")

        # 2. Update Users CSV (Append 20 dummy users to existing or create new)
        if os.path.exists('users_expanded.csv'):
            users = pd.read_csv('users_expanded.csv')
            users = users[~users['email'].str.endswith('@fashionverse.com', na=False)].copy()
        else:
            users = pd.DataFrame(columns=['user_id', 'name', 'email'])
            
        print(f"Adding 20 dummy users to CSV...")
        new_users = []
        for i, u in enumerate(DUMMY_USERS_DATA):
            dummy_id = f"699fdb{i:02d}db20a4f81caecc4{i:02d}"
            new_users.append({
                'user_id': dummy_id,
                'name': u['name'],
                'email': u['email']
            })
            
        new_users_df = pd.DataFrame(new_users)
        updated_users = pd.concat([users, new_users_df], ignore_index=True)
        updated_users.to_csv('users_expanded.csv', index=False)
        print(f"[SUCCESS] users_expanded.csv updated: {len(updated_users)} total users.")

        # 3. Create purchases based on user clusters
        if os.path.exists('purchases_expanded.csv'):
            purchases = pd.read_csv('purchases_expanded.csv')
            purchases = purchases[purchases['user_id'].isin(updated_users['user_id'])].copy()
        else:
            purchases = pd.DataFrame(columns=['user_id', 'product_id', 'purchase_date'])

        products_by_cat = {}
        for _, prod in products.iterrows():
            cat = prod['category']
            if cat not in products_by_cat:
                products_by_cat[cat] = []
            products_by_cat[cat].append(str(prod['product_id']))

        all_cats = list(products_by_cat.keys())
        all_product_ids = products['product_id'].astype(str).tolist()

        new_user_ids = [nu['user_id'] for nu in new_users]
        user_clusters = {
            "Women": new_user_ids[0:8],
            "Men": new_user_ids[8:15],
            "Kids": new_user_ids[15:20]
        }

        print("Generating structured purchases for dummy users...")
        new_purchases = []
        
        for cat, users_in_cluster in user_clusters.items():
            cat_products = products_by_cat.get(cat, all_product_ids)
            if not cat_products:
                cat_products = all_product_ids
                
            hot_products = cat_products[:min(2, len(cat_products))]
            remaining_products = cat_products[min(2, len(cat_products)):]

            for u_id in users_in_cluster:
                num_to_buy = random.randint(2, 4)
                purchased_prods = []
                
                if random.random() < 0.80 and hot_products:
                    purchased_prods.append(random.choice(hot_products))
                    
                num_others = num_to_buy - len(purchased_prods)
                if remaining_products and num_others > 0:
                    purchased_prods.extend(random.sample(remaining_products, min(num_others, len(remaining_products))))
                    
                if random.random() < 0.15 and len(all_cats) > 1:
                    other_cat = random.choice([c for c in all_cats if c != cat])
                    other_cat_prods = products_by_cat.get(other_cat, all_product_ids)
                    if other_cat_prods:
                        purchased_prods.append(random.choice(other_cat_prods))

                for p_id in purchased_prods:
                    new_purchases.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'purchase_date': (datetime.now() - timedelta(days=random.randint(1, 20))).strftime('%Y-%m-%d %H:%M:%S')
                    })

        new_purchases_df = pd.DataFrame(new_purchases)
        updated_purchases = pd.concat([purchases, new_purchases_df], ignore_index=True)
        updated_purchases.to_csv('purchases_expanded.csv', index=False)
        print(f"[SUCCESS] purchases_expanded.csv updated: {len(updated_purchases)} total purchases.")

        # 4. Generate Browsing History based on clusters
        if os.path.exists('browsing_history_expanded.csv'):
            browsing = pd.read_csv('browsing_history_expanded.csv')
            browsing = browsing[browsing['user_id'].isin(updated_users['user_id'])].copy()
        else:
            browsing = pd.DataFrame(columns=['user_id', 'product_id', 'browse_date'])

        print("Generating matching browsing history...")
        new_browsing = []
        user_purchases_map = updated_purchases.groupby('user_id')['product_id'].apply(list).to_dict()

        for _, user in updated_users.iterrows():
            u_id = str(user['user_id'])
            user_purchased = user_purchases_map.get(u_id, [])
            
            preferred_categories = []
            if user_purchased:
                pref_cats = products[products['product_id'].astype(str).isin([str(x) for x in user_purchased])]['category'].tolist()
                preferred_categories = list(set(pref_cats))
            
            if not preferred_categories:
                preferred_categories = [random.choice(all_cats)]

            pref_products = products[products['category'].isin(preferred_categories)]['product_id'].astype(str).tolist()

            # Browse what they bought
            for p_id in user_purchased:
                if random.random() < 0.90:
                    new_browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })

            # Browse other items in category
            num_browses = random.randint(3, 7)
            other_prods = [p for p in pref_products if p not in [str(x) for x in user_purchased]]
            if other_prods:
                selected_prods = random.sample(other_prods, min(num_browses, len(other_prods)))
                for p_id in selected_prods:
                    new_browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })

            # Explore outside category
            explore_prods = products[~products['category'].isin(preferred_categories)]['product_id'].astype(str).tolist()
            if explore_prods and random.random() < 0.4:
                explore_selected = random.sample(explore_prods, min(2, len(explore_prods)))
                for p_id in explore_selected:
                    new_browsing.append({
                        'user_id': u_id,
                        'product_id': p_id,
                        'browse_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S')
                    })

        new_browsing_df = pd.DataFrame(new_browsing)
        updated_browsing = pd.concat([browsing, new_browsing_df], ignore_index=True)
        updated_browsing.to_csv('browsing_history_expanded.csv', index=False)
        print(f"[SUCCESS] browsing_history_expanded.csv updated: {len(updated_browsing)} total browsing history.")
        
        # 5. Product images file
        if not os.path.exists('product_images_expanded.csv'):
            print("Creating dummy product_images_expanded.csv...")
            images_list = []
            for _, prod in products.iterrows():
                images_list.append({
                    'product_id': str(prod['product_id']),
                    'image_path': ''
                })
            pd.DataFrame(images_list).to_csv('product_images_expanded.csv', index=False)
            print("[SUCCESS] Created product_images_expanded.csv!")

        print("[SUCCESS] OFFLINE LOCAL CSV DATA SEEDING COMPLETED SUCCESSFULLY!")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to seed local CSV files: {e}")
        return False

# ----------------- MAIN EXECUTION FLOW -----------------
if __name__ == "__main__":
    print("="*60)
    print("FASHIONVERSE RECOMMENDATION SYSTEM MOCK DATA SEEDER")
    print("="*60)
    
    # 1. Try seeding MongoDB first
    mongo_success = False
    if MONGO_AVAILABLE:
        mongo_success = seed_mongodb()
        
    # 2. If MongoDB seeding succeeded, synchronize it to local CSV files
    sync_success = False
    if mongo_success:
        sync_success = sync_mongodb_to_csv()
        
    # 3. Fallback to offline local CSV seeding if either MongoDB seeding or syncing failed
    if not mongo_success or not sync_success:
        print("\n[WARNING] MongoDB database or sync failed. Seeding locally directly to CSVs...")
        seed_offline_local_csv()
        
    print("="*60)
    print("SEEDING COMPLETED!")
    print("="*60)
