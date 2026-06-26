import React, { Component } from "react";
import { withRouter } from "../utils/withRouter";
import api from "../api";
import { WishlistContext } from "../context/WishlistContext";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

class ProductGrid extends Component {
  static contextType = WishlistContext;

  constructor(props) {
    super(props);
    this.state = {
      products: [],
      loading: true,
      error: null
    };
    this.scrollRef = React.createRef();
    this.autoScrollInterval = null;
  }

  componentDidMount() {
    this.fetchNewArrivals();

    // Auto-scroll every 4 seconds
    this.autoScrollInterval = setInterval(() => {
      this.autoScroll();
    }, 4000);
  }

  componentWillUnmount() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  autoScroll = () => {
    const container = this.scrollRef.current;
    if (container) {
      const scrollAmount = 300;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  fetchNewArrivals = async () => {
    try {
      // Fetch products from last 7 days, max 7
      const res = await api.get("/products?isNewArrival=true&limit=7");
      this.setState({
        products: res.data.products || [],
        loading: false
      });
    } catch (err) {
      console.error("Failed to fetch arrivals:", err);
      this.setState({ error: "Failed to load products", loading: false });
    }
  };



  handleProductClick = (product) => {
    const formattedProduct = {
      ...product,
      id: product._id,
      image: product.images?.[0] ? `http://localhost:5005/uploads/${product.images[0]}` : "",
      images: product.images?.map(img => `http://localhost:5005/uploads/${img}`) || []
    };

    this.props.navigate(`/product/${product.productId || product._id}`, {
      state: {
        product: formattedProduct,
        from: "new-arrivals"
      },
    });
  };

  render() {
    const { products, loading, error } = this.state;

    if (loading) return null;
    if (products.length === 0) return null; // Don't show section if no new arrivals

    return (
      <section className="product-section">
        <h2>New Arrivals</h2>

        <div className="brand-container" style={{ position: 'relative' }}>
          <div
            className="brand-scroll product-grid"
            ref={this.scrollRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              gap: '20px',
              padding: '10px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>{`.brand-scroll::-webkit-scrollbar { display: none; }`}</style>

            {products.map((p) => {
              const isFav = this.context.isInWishlist(p._id);
              return (
                <div
                  className="product-card"
                  key={p._id}
                  onClick={() => this.handleProductClick(p)}
                  style={{ flex: '0 0 auto', width: '280px', position: 'relative' }}
                >
                  <img
                    src={p.images?.[0] ? `http://localhost:5005/uploads/${p.images[0]}` : "https://via.placeholder.com/300"}
                    alt={p.name}
                    style={{ width: '100%', height: '350px', objectFit: 'cover', objectPosition: 'top', borderRadius: '8px' }}
                  />
                  <div className="product-card-content">
                    <span>{typeof p.brand === 'object' ? p.brand?.name : "FashionVerse"}</span>
                    <h4>{p.name}</h4>
                    <div className="price-wishlist-row">
                      <p>Rs. {p.price?.toLocaleString()}</p>
                      <div className={`wishlist-icon-inline ${isFav ? 'active' : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        const token = localStorage.getItem("token");
                        const role = localStorage.getItem("role");

                        if (!token || role !== 'customer') {
                          this.props.navigate("/login?redirectTo=" + encodeURIComponent(window.location.pathname));
                          return;
                        }

                        this.context.toggleWishlist(p);
                      }}>
                        {isFav ? <AiFillHeart color="#e31b23" /> : <AiOutlineHeart />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
}

export default withRouter(ProductGrid);
