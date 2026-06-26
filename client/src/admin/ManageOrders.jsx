import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/AdminOrders.css";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/orders");
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  if (loading) return <AdminLayout><div className="loading">Loading orders...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="error">{error}</div></AdminLayout>;

  return (
    <AdminLayout breadcrumb={
      <>
        <span className="brand-link">FashionVerse Admin</span>
        <span className="separator">/</span>
        <span className="current">Order Management</span>
      </>
    }>
      <div className="dashboard-content">
        <div className="order-management-header" style={{ marginBottom: '20px' }}>
          <div className="header-info">
            <h1>Manage Orders</h1>
            <p>Track and manage customer orders, payments, and delivery statuses.</p>
          </div>
        </div>

        <div className="orders-table-container" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Payment</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => handleViewDetails(order)}>
                    <td style={{ padding: '15px' }}>
                      <span style={{ fontSize: '12px', color: '#667eea', fontWeight: 'bold' }}>#{order._id.substring(0, 8)}...</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600' }}>{order.userId?.name || 'Guest'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.userId?.email}</div>
                    </td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>Rs. {order.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ fontSize: '12px' }}>{order.paymentMethod?.replace('_', ' ').toUpperCase()}</span>
                      <div style={{ fontSize: '10px', color: order.paymentStatus === 'completed' ? '#22c55e' : '#ef4444' }}>
                        {order.paymentStatus?.toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span className={`status-badge ${order.orderStatus}`} style={{ 
                        padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: order.orderStatus === 'delivered' ? '#d1fae5' : order.orderStatus === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: order.orderStatus === 'delivered' ? '#065f46' : order.orderStatus === 'cancelled' ? '#991b1b' : '#92400e'
                      }}>
                        {order.orderStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '12px', color: '#64748b' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}
                        style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        View Info
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
            <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Order Details</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Order ID: #{selectedOrder._id}</span>
              </div>
              <button onClick={closeDetailModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                {/* Customer & Shipping */}
                <div>
                  <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.userId?.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.userId?.email}</p>
                  <p><strong>Contact:</strong> {selectedOrder.shippingAddress?.phone}</p>
                  
                  <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px', marginTop: '24px' }}>Shipping Address</h4>
                  <p style={{ lineHeight: '1.6', color: '#475569' }}>
                    {selectedOrder.shippingAddress?.address}<br />
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
                    {selectedOrder.shippingAddress?.country}
                  </p>
                </div>

                {/* Payment & Status */}
                <div>
                  <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>Payment Info</h4>
                  <p><strong>Method:</strong> {selectedOrder.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Status:</strong> <span style={{ color: selectedOrder.paymentStatus === 'completed' ? 'green' : 'red' }}>{selectedOrder.paymentStatus?.toUpperCase()}</span></p>
                  <p><strong>Amount:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>Rs. {selectedOrder.totalAmount?.toLocaleString()}</span></p>

                  <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px', marginTop: '24px' }}>Order Management</h4>
                  <div className="status-update">
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Change Order Status:</label>
                    <select 
                      value={selectedOrder.orderStatus} 
                      onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>Order Items</h4>
              <div style={{ borderRadius: '8px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Price</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Qty</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '500' }}>{item.productId?.name || 'Deleted Product'}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {item.productId?._id}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>Rs. {item.price?.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: '#fff', borderTop: '2px solid #f1f5f9' }}>
                    <tr>
                      <td colSpan="3" style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>
                        Rs. {selectedOrder.totalAmount?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button onClick={closeDetailModal} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageOrders;
