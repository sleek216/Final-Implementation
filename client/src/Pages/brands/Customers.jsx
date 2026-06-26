import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../styles/brands/BrandDashboard.css"; // Reuse existing styles

const Customers = ({ searchTerm }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get("/brand/customers");
                setCustomers(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching customers:", err);
                setError("Failed to load customers list");
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const getFilteredCustomers = () => {
        if (!searchTerm || searchTerm.trim() === "") return customers;
        const term = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(term) || 
            c.email.toLowerCase().includes(term)
        );
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading customers...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

    const filteredCustomers = getFilteredCustomers();

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <div>
                    <h1>Customer Insights</h1>
                    <p>Track your audience and their purchase history.</p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-head">
                    <h3>Customer Directory</h3>
                    <span className="muted">{filteredCustomers.length} total customers</span>
                </div>

                <div className="table-responsive">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Last Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    background: '#f1f5f9',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    color: '#64748b'
                                                }}>
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <strong>{customer.name}</strong>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        Since {new Date(customer.customerSince).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '12px' }}>{customer.email}</td>
                                        <td>{customer.totalOrders} items</td>
                                        <td><strong>Rs. {customer.totalSpent.toLocaleString()}</strong></td>
                                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No customers joined yet. Records appear once sales occur.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
