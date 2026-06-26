import React, { Component } from "react";

// Import icons
import calendarIcon from "../../assets/icons/calendar_month.png";

class Dashboard extends Component {
    render() {
        return (
            <div className="dash-wrapper">

                {/* HEADER */}
                <div className="dash-header">
                    <div>
                        <h1>{this.props.brand?.name || "Brand Dashboard"}</h1>
                        <p>Performance report: <strong>{this.props.stats?.period || "Last 30 Days"}</strong></p>
                    </div>

                    <div className="dash-actions">
                        <select
                            className="ghost-btn"
                            style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
                            value={this.props.period}
                            onChange={(e) => this.props.onPeriodChange(e.target.value)}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="365">Last Year</option>
                            <option value="0">All Time</option>
                        </select>
                        <button className="primary-btn" onClick={this.props.onExport}>↓ Export</button>
                    </div>
                </div>

                {/* STATS */}
                <div className="dash-stats">

                    {/* Total Sales */}
                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Total Sales</span>
                            <span className="pill success">+12.4%</span>
                        </div>
                        <h2 className="stat-value">
                            Rs. {this.props.stats?.revenue?.toLocaleString() || "0"}
                        </h2>
                        <div className="stat-info-numeric" style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                            Target: Rs. {(this.props.stats?.revenue * 1.5 || 50000).toLocaleString()}
                        </div>
                    </div>

                    {/* Products (Active Assets) */}
                    <div className="stat-card">
                        <span className="stat-label">Total Products</span>
                        <h2 className="stat-value">{this.props.stats?.products || 0}</h2>
                        <div className="stat-info-numeric" style={{ fontSize: '12px', color: '#0ea5e9', marginTop: '10px', fontWeight: '500' }}>
                            {this.props.stats?.products > 0 ? "Items Live & Active" : "No active items"}
                        </div>
                    </div>

                    {/* Orders (Total) */}
                    <div className="stat-card">
                        <span className="stat-label">Total Orders</span>
                        <h2 className="stat-value">{this.props.stats?.orders || 0}</h2>
                        <div className="stat-info-numeric" style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                            {this.props.stats?.orders > 0 ? `${this.props.stats.orders} Successful Orders` : "Waiting for first order"}
                        </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Pending Orders</span>
                            <span className="pill urgent">Urgent</span>
                        </div>
                        <h2 className="stat-value">{this.props.stats?.pendingOrders || 0}</h2>
                        <a className="link">Review pending shipments →</a>
                    </div>

                </div>

                {/* LOWER GRID */}
                <div className="dash-grid">

                    {/* RECENT ACTIVITY */}
                    <div className="card">
                        <div className="card-head">
                            <h3>Recent Activity</h3>
                            <a className="link">View All</a>
                        </div>

                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.props.stats?.recentActivities && this.props.stats.recentActivities.length > 0 ? (
                                    this.props.stats.recentActivities.map((activity, index) => (
                                        <tr key={index}>
                                            <td className="order-id">#FV-{activity.orderId}</td>
                                            <td>{activity.customerName}</td>
                                            <td>
                                                <span className={`status-dot ${activity.status === 'pending' ? 'processing' : 'live'}`}></span>
                                                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                            </td>
                                            <td>Rs. {activity.amount?.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                            No recent activity found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TOP SELLERS */}
                    <div className="card">
                        <div className="card-head">
                            <h3>Top Sellers</h3>
                            <span className="muted">Overall</span>
                        </div>

                        {this.props.stats?.topSellers && this.props.stats.topSellers.length > 0 ? (
                            this.props.stats.topSellers.map((seller, index) => (
                                <div className="seller" key={index}>
                                    <div className="avatar">
                                        {seller.image ? (
                                            <img src={`http://localhost:5005/uploads/${seller.image}`} alt={seller.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                                        ) : null}
                                    </div>
                                    <div className="seller-info">
                                        <strong style={{ fontSize: '13px' }}>{seller.name}</strong>
                                        <p>{seller.salesCount} sales total</p>
                                    </div>
                                    <span className="seller-price">Rs. {seller.price?.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-sellers" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                <p style={{ fontSize: '13px' }}>No sales recorded yet.</p>
                            </div>
                        )}

                        <a className="link center">See All Performance Metrics</a>
                    </div>

                </div>
            </div>
        );
    }
}

export default Dashboard;
