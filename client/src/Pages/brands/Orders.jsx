import React, { Component } from "react";
import "../../styles/brands/BrandDashboard.css";
import api from "../../api";

class Orders extends Component {
    state = {
        orders: [],
        loading: true,
        error: null,
        activeFilter: "All Orders",
        selectedOrder: null,
        showDetailModal: false
    };

    async componentDidMount() {
        this.fetchOrders();
    }

    fetchOrders = async () => {
        try {
            const res = await api.get("/brand/orders");
            this.setState({ orders: res.data, loading: false });
        } catch (err) {
            console.error("Error fetching orders:", err);
            this.setState({ error: "Failed to load orders", loading: false });
        }
    };

    handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.put(`/brand/orders/${orderId}/status`, { status: newStatus });
            // Refresh orders after update
            this.fetchOrders();
            if (this.state.selectedOrder && this.state.selectedOrder._id === orderId) {
                this.setState({
                    selectedOrder: { ...this.state.selectedOrder, orderStatus: newStatus }
                });
            }
            alert(`Status updated to ${newStatus}`);
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
        }
    };

    getFilteredOrders = () => {
        const { orders, activeFilter } = this.state;
        const { searchTerm } = this.props;
        let filtered = orders;

        if (activeFilter !== "All Orders") {
            filtered = filtered.filter(o => o.orderStatus.toLowerCase() === activeFilter.toLowerCase());
        }

        if (searchTerm && searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o => 
                o._id.toLowerCase().includes(term) || 
                (o.userId?.name && o.userId.name.toLowerCase().includes(term)) ||
                (o.userId?.email && o.userId.email.toLowerCase().includes(term)) ||
                o.items.some(item => item.productId?.name && item.productId.name.toLowerCase().includes(term))
            );
        }

        return filtered;
    };

    handleViewDetails = (order) => {
        this.setState({ selectedOrder: order, showDetailModal: true });
    };

    closeModal = () => {
        this.setState({ selectedOrder: null, showDetailModal: false });
    };

    render() {
        const { orders, loading, error, activeFilter, selectedOrder, showDetailModal } = this.state;

        if (loading) return <div className="dash-wrapper"><p>Loading Orders...</p></div>;
        if (error) return <div className="dash-wrapper"><p style={{ color: 'red' }}>{error}</p></div>;

        const totalVolume = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const pendingCount = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
        const shippedCount = orders.filter(o => o.orderStatus === 'shipped').length;
        const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;

        const filteredOrders = this.getFilteredOrders();

        return (
            <div className="dash-wrapper">
                <div className="subpage-header">
                    <div>
                        <h1>Order Management</h1>
                        <p className="muted">Track and manage your customer orders.</p>
                    </div>
                </div>

                <div className="dash-stats">
                    <div className="stat-card">
                        <span className="stat-label">Total Volume</span>
                        <h2 className="stat-value">Rs. {totalVolume.toLocaleString()}</h2>
                        <span className="pill success">All Time</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Pending Sync</span>
                        <h2 className="stat-value">{pendingCount}</h2>
                        <span className="pill warning">Active</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">In Transit</span>
                        <h2 className="stat-value">{shippedCount}</h2>
                        <span className="pill info">Current</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Delivered</span>
                        <h2 className="stat-value">{deliveredCount}</h2>
                        <span className="pill success">Success</span>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="tabs-group">
                        {["All Orders", "Pending", "Shipped", "Delivered"].map(tab => (
                            <button
                                key={tab}
                                className={`pill-tab ${activeFilter === tab ? "active" : ""}`}
                                onClick={() => this.setState({ activeFilter: tab })}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="list-container">
                    <div className="list-header orders-list-grid">
                        <div>Order ID</div>
                        <div>Product Information</div>
                        <div>Customer</div>
                        <div>Status</div>
                        <div style={{ textAlign: 'right' }}>Action</div>
                    </div>

                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <div className="list-row orders-list-grid" key={order._id} onClick={() => this.handleViewDetails(order)} style={{ cursor: 'pointer' }}>
                                <div className="order-id-cell">
                                    <span className="order-id-main">#{order._id.slice(-8).toUpperCase()}</span>
                                    <span className="order-id-sub">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="product-cell">
                                    <div className="product-info-v">
                                        <span className="product-name-v" style={{ fontWeight: '600' }}>
                                            {order.items[0]?.productId?.name || "Multiple Items"}
                                            {order.items.length > 1 && ` (+${order.items.length - 1} more)`}
                                        </span>
                                        <span className="product-cat-v">Total: Rs. {order.totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500' }}>{order.userId?.name || "Guest"}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.userId?.email}</div>
                                </div>
                                <div>
                                    <span className={`pill ${order.orderStatus === 'delivered' ? 'success' : order.orderStatus === 'cancelled' ? 'danger' : 'warning'}`}>
                                        {order.orderStatus.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button onClick={(e) => { e.stopPropagation(); this.handleViewDetails(order); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', cursor: 'pointer' }}>
                                        View Detail
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No orders found.</div>
                    )}
                </div>

                {/* MODAL FOR ORDER DETAILS */}
                {showDetailModal && selectedOrder && (
                    <div className="modal-overlay" onClick={this.closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Order Details #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                                <button onClick={this.closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                            </div>
                            
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                                    {/* Customer & Shipping */}
                                    <div>
                                        <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Customer Info</h4>
                                        <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>{selectedOrder.userId?.name || 'Guest User'}</p>
                                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>{selectedOrder.userId?.email}</p>
                                        
                                        <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Shipping Address</h4>
                                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                                            <strong>{selectedOrder.shippingAddress?.name}</strong> ({selectedOrder.shippingAddress?.phone})<br />
                                            {selectedOrder.shippingAddress?.address}<br />
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
                                        </div>
                                    </div>

                                    {/* Status & Payment */}
                                    <div>
                                        <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Payment Info</h4>
                                        <p style={{ margin: '0 0 5px 0' }}>Method: <strong>{selectedOrder.paymentMethod?.replace('_', ' ').toUpperCase()}</strong></p>
                                        <p style={{ margin: '0 0 15px 0' }}>Status: <span style={{ color: selectedOrder.paymentStatus === 'completed' ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>{selectedOrder.paymentStatus?.toUpperCase()}</span></p>

                                        <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Update Status</h4>
                                        <select 
                                            value={selectedOrder.orderStatus} 
                                            onChange={(e) => this.handleStatusUpdate(selectedOrder._id, e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Order Items</h4>
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc', fontSize: '12px', color: '#64748b' }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>Price</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item, id) => (
                                                <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.productId?.name || 'Deleted Product'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Rs. {item.price?.toLocaleString()}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot style={{ background: '#f8fafc' }}>
                                            <tr>
                                                <td colSpan="3" style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Total Amount:</td>
                                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>
                                                    Rs. {selectedOrder.totalAmount?.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                                <button onClick={this.closeModal} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Orders;
