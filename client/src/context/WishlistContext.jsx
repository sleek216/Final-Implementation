import React, { Component, createContext } from "react";

export const WishlistContext = createContext();

export class WishlistProvider extends Component {
    constructor(props) {
        super(props);

        this.state = {
            wishlist: [],
            userId: null
        };
    }

    componentDidMount() {
        this.loadUserWishlist();
        // Add listener for storage changes (to sync across tabs or handle login/logout)
        window.addEventListener('storage', this.handleStorageChange);
        // Poll for login state changes in same tab (storage event doesn't fire for same-tab changes)
        this._checkInterval = setInterval(() => {
            const userStr = localStorage.getItem("user");
            const currentUserId = userStr ? (JSON.parse(userStr)._id || JSON.parse(userStr).id) : null;
            if (currentUserId !== this.state.userId) {
                this.loadUserWishlist();
            }
        }, 1000);
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this.handleStorageChange);
        if (this._checkInterval) clearInterval(this._checkInterval);
    }

    handleStorageChange = (e) => {
        if (e.key === 'user' || e.key === 'token') {
            this.loadUserWishlist();
        }
    };

    loadUserWishlist = () => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const userId = user._id || user.id;
                const savedWishlist = JSON.parse(localStorage.getItem(`wishlist_${userId}`)) || [];
                this.setState({ wishlist: savedWishlist, userId });
            } catch (err) {
                console.error("Error parsing user from localStorage:", err);
                this.setState({ wishlist: [], userId: null });
            }
        } else {
            this.setState({ wishlist: [], userId: null });
        }
    };

    toggleWishlist = (product) => {
        const { userId, wishlist } = this.state;

        if (!userId) {
            // This should be handled by the UI (redirect to login), 
            // but we add it here as a safety measure.
            console.warn("User not logged in. Cannot toggle wishlist.");
            return;
        }

        const isExist = wishlist.some(item => item._id === product._id);
        let newWishlist;

        if (isExist) {
            newWishlist = wishlist.filter(item => item._id !== product._id);
        } else {
            newWishlist = [...wishlist, product];
        }

        this.setState({ wishlist: newWishlist }, () => {
            localStorage.setItem(`wishlist_${userId}`, JSON.stringify(newWishlist));
        });
    };

    isInWishlist = (productId) => {
        return this.state.wishlist.some(item => item._id === productId);
    };

    clearWishlist = () => {
        this.setState({ wishlist: [] });
        localStorage.removeItem("wishlist");
    };

    render() {
        return (
            <WishlistContext.Provider
                value={{
                    ...this.state,
                    toggleWishlist: this.toggleWishlist,
                    isInWishlist: this.isInWishlist,
                    clearWishlist: this.clearWishlist,
                }}
            >
                {this.props.children}
            </WishlistContext.Provider>
        );
    }
}
