import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import StoreHero from "../components/StoreHero";
import BrandCatalog from "../components/BrandCatalog";
import ProductGrid from "../components/ProductGrid";
import ProductFooter from "../components/ProductFooter";
import RecommendationSection from "../components/RecommendationSection";
import api from "../api";
import "../styles/Home.css";

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popularProducts: [],
      userRecommendations: [],
      loading: false,
      userRecLoading: false,
      hasFetched: false // Prevent infinite loops
    };
  }

  componentDidMount() {
    if (!this.state.hasFetched) {
      this.fetchPopularProducts();
      this.fetchUserRecommendations();
      this.setState({ hasFetched: true });
    }
  }

  fetchPopularProducts = async () => {
    if (this.state.loading) return;
    try {
      this.setState({ loading: true });
      // Fetch from Flask ML engine
      const response = await fetch('http://localhost:5005/api/recommendations/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'guest' }) // Guest uses popular items
      });
      const data = await response.json();
      if (data.success) {
        this.setState({ popularProducts: data.recommendations });
      }
    } catch (error) {
      console.error('Error fetching popular products:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchUserRecommendations = async () => {
    if (this.state.userRecLoading) return;

    // Try to get user from localStorage 'user' object
    let userId = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || user._id;
      }
    } catch (e) { }

    const role = localStorage.getItem("role");

    if (!userId || role !== 'customer') return;

    try {
      this.setState({ userRecLoading: true });
      const response = await fetch('http://localhost:5005/api/recommendations/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      if (data.success) {
        this.setState({ userRecommendations: data.recommendations });
      }
    } catch (error) {
      console.error('Error fetching user recommendations:', error);
    } finally {
      this.setState({ userRecLoading: false });
    }
  };

  render() {
    const { popularProducts, userRecommendations, loading, userRecLoading } = this.state;
    return (
      <>
        <StoreNavbar />
        <StoreHero />
        <BrandCatalog />
        <ProductGrid />

        {userRecommendations.length > 0 && (
          <RecommendationSection
            products={userRecommendations}
            loading={userRecLoading}
            title="Just For You"
          />
        )}

        <RecommendationSection
          products={popularProducts}
          loading={loading}
          title=" Popular & Top Rated"
        />
        <ProductFooter />
      </>
    );
  }
}

export default HomePage;