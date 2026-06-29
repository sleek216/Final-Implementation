from pymongo import MongoClient
import pandas as pd

# MongoDB Atlas connection
client = MongoClient('mongodb+srv://hyberistics7617_db_user:On7LrwaYWqMvugeN@cluster0.5od8xrz.mongodb.net/fashionverse')
db = client['fashionverse']

# ============ USERS ============
users = pd.DataFrame(list(db.users.find()))
if not users.empty:
    users = users[['_id', 'name', 'email']].copy()
    users.rename(columns={'_id': 'user_id'}, inplace=True)
    users.to_csv('users_expanded.csv', index=False)
    print(f"✅ Users exported: {len(users)} records")
else:
    print("❌ No users found")

# ============ PRODUCTS ============
products = pd.DataFrame(list(db.products.find()))
if not products.empty:
    print("Product columns:", products.columns.tolist())
    # Columns jo available hain un se kaam chalate hain
    available_cols = ['_id', 'name', 'category', 'price', 'description']
    existing_cols = [c for c in available_cols if c in products.columns]
    products = products[existing_cols].copy()
    products.rename(columns={'_id': 'product_id', 'name': 'product_name'}, inplace=True)
    # Rating column add karo agar nahi hai
    if 'rating' not in products.columns:
        products['rating'] = 4.0
    products.to_csv('products_expanded.csv', index=False)
    print(f"✅ Products exported: {len(products)} records")
else:
    print("❌ No products found")

# ============ ORDERS (purchases ki jagah) ============
orders = pd.DataFrame(list(db.orders.find()))
if not orders.empty:
    print("Order columns:", orders.columns.tolist())
    purchases = []
    for _, order in orders.iterrows():
        user_id = order.get('user', order.get('userId', order.get('user_id', '')))
        items = order.get('items', order.get('orderItems', []))
        if isinstance(items, list):
            for item in items:
                product_id = item.get('product', item.get('productId', item.get('product_id', '')))
                purchases.append({
                    'user_id': str(user_id),
                    'product_id': str(product_id),
                    'purchase_date': order.get('createdAt', '2024-01-01')
                })
    
    purchases_df = pd.DataFrame(purchases)
    if not purchases_df.empty:
        purchases_df.to_csv('purchases_expanded.csv', index=False)
        print(f"✅ Purchases exported: {len(purchases_df)} records")
    else:
        print("⚠️ Orders empty - creating sample purchases")
        # Sample purchases banao
        sample = pd.DataFrame({
            'user_id': [str(users['user_id'].iloc[0])] * 3,
            'product_id': [str(products['product_id'].iloc[i]) for i in range(min(3, len(products)))],
            'purchase_date': ['2024-01-01', '2024-01-02', '2024-01-03']
        })
        sample.to_csv('purchases_expanded.csv', index=False)
else:
    print("❌ No orders found")

# ============ BROWSING HISTORY ============
# Browsing history collection nahi hai to products se banate hain
if not users.empty and not products.empty:
    browsing = []
    for i, user in users.iterrows():
        for j, product in products.head(3).iterrows():
            browsing.append({
                'user_id': str(user['user_id']),
                'product_id': str(product['product_id']),
                'browse_date': '2024-01-01'
            })
    browsing_df = pd.DataFrame(browsing)
    browsing_df.to_csv('browsing_history_expanded.csv', index=False)
    print(f"✅ Browsing history created: {len(browsing_df)} records")

print("\n✅ ALL CSV FILES READY!")


# ============ PRODUCT IMAGES ============
products_raw = pd.DataFrame(list(db.products.find()))

product_images_list = []
for _, product in products_raw.iterrows():
    images = product.get('images', [])
    if isinstance(images, list) and len(images) > 0:
        # Pehli image lo
        image_url = images[0]
    else:
        image_url = ''
    
    product_images_list.append({
        'product_id': str(product['_id']),
        'image_path': image_url
    })

product_images_df = pd.DataFrame(product_images_list)
product_images_df.to_csv('product_images_expanded.csv', index=False)
print(f"✅ Product images exported: {len(product_images_df)} records")
client.close()

