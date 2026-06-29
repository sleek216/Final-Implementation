# FashionVerse Recommendation System - Technical Documentation

## 1. Overview of the Flow
The recommendation engine is integrated throughout the customer journey to maximize engagement and sales. Each stage uses a specific algorithm optimized for that context:

| User Touchpoint | Algorithm Type | Logic Applied |
| :--- | :--- | :--- |
| **Homepage** | **Hybrid Model** | Combines user behavior with trending items for a "For You" feed. |
| **Product Detail (PDP)** | **Content-Based Filtering** | Recommends items in the same style or category based on attributes. |
| **Cart / Checkout** | **Hybrid Recommendation** | Suggests personalized or trending items combining collaborative taste and attributes. |
| **Search / Category** | **Collaborative Filtering** | Re-ranks the search results based on the individual user's taste. |
| **Order Confirmation** | **Hybrid Recommendation** | "Post-purchase" suggestions for what the user might like next. |

---

## 2. Deep Dive: Algorithms & Mathematics

### A. Content-Based Filtering (Style Matching)
**Goal**: Recommend items similar to what the user is currently looking at.
- **Vectorization (TF-IDF)**: Hum product ki description aur category ko numbers mein convert karte hain. Isay **Term Frequency-Inverse Document Frequency (TF-IDF)** kehte hain. Ye computer ko batata hai ke "Chiffon" ya "Black" jese words kitne important hain.
- **Cosine Similarity**: Phir hum har product ka aik **Vector** banate hain aur unke darmiyan "angle" calculate karte hain. Agar do products ka angle chota hai, matlab wo style mein bohat similar hain.

### B. Collaborative Filtering ("Users Like You")
**Goal**: Recommend items based on the behavior of similar users.
- **User-Item Matrix**: Hum aik bari table (Matrix) banate hain jahan aik side par `Users` hote hain aur dusri side par `Products`. Is table mein fill kiya jata hai ke kis user ne kya khareeda ya dekha.
- **Similarity Matrix**: Hum users ke darmiyan similarity dhoondte hain. Agar User A aur User B ne 5 same dresses dekhe hain, to system User A ko wo cheez dikhayega jo User B ne khareedi magar User A ne abhi tak nahi dekhi.

### C. Hybrid Model (The Gold Standard)
**Goal**: Combine the strengths of both above methods.
- System pehle Collaborative filtering se results nikalta hai, phir unhein Content-based scores ke saath merge karta hai. Is se "Cold Start" problem (naye users ke liye recommendations na hona) khatam ho jati hai.

---

## 3. Vector & Matrix concepts (For Mam)
If Mam asks about the math:
1. **Vector**: Har product aik point hai multidimensional space mein. Us point ki position uske attributes (Color, Style, Price) tay karte hain.
2. **Matrix**: Ye pure platform ka data aik grid mein store karta hai. Row = User, Column = Product.
3. **Dot Product**: Do vectors ko multiply kar ke similarity score nikalne ka tareeqa.

---

## 4. Implementation Details
- **Language**: Python (Flask)
- **Libraries**: 
    - `Pandas`: Data handling ke liye.
    - `Scikit-Learn`: Vectorization aur Similarity calculations ke liye.
    - `NumPy`: High-speed matrix operations ke liye.
