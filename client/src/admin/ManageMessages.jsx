import React, { Component } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/ManageMessages.css";

class ManageMessages extends Component {
    state = {
        messages: [],
        loading: true,
        selectedMessage: null,
        error: null,
    };

    componentDidMount() {
        this.fetchMessages();
    }

    fetchMessages = async () => {
        try {
            this.setState({ loading: true });
            const res = await api.get("/admin/messages");
            this.setState({ messages: res.data, loading: false });
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            this.setState({ error: "Failed to load messages", loading: false });
        }
    };

    handleViewMessage = async (id) => {
        try {
            const res = await api.get(`/admin/messages/${id}`);
            this.setState({ selectedMessage: res.data });
            // Update the message in the list to reflect "read" status
            this.setState(prevState => ({
                messages: prevState.messages.map(m => m._id === id ? { ...m, status: 'read' } : m)
            }));
        } catch (err) {
            console.error("Failed to fetch message details:", err);
            alert("Error loading message details");
        }
    };

    handleDeleteMessage = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            await api.delete(`/admin/messages/${id}`);
            this.setState(prevState => ({
                messages: prevState.messages.filter(m => m._id !== id),
                selectedMessage: prevState.selectedMessage?._id === id ? null : prevState.selectedMessage
            }));
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete message");
        }
    };

    closeModal = () => {
        this.setState({ selectedMessage: null });
    };

    render() {
        const { messages, loading, selectedMessage, error } = this.state;

        const breadcrumb = (
            <>
                <span className="brand-link">Admin</span>
                <span className="separator">/</span>
                <span className="current">Customer Messages</span>
            </>
        );

        return (
            <AdminLayout breadcrumb={breadcrumb}>
                <div className="manage-messages-container">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Inbox</h1>
                            <p className="page-subtitle">Manage customer inquiries and messages</p>
                        </div>
                    </div>

                    {error && <div className="error-alert">{error}</div>}

                    {loading ? (
                        <div className="loading-state">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: '48px' }}>📬</span>
                            <h3>No messages found</h3>
                            <p>Your inbox is empty.</p>
                        </div>
                    ) : (
                        <div className="messages-grid">
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`message-box ${msg.status === 'unread' ? 'unread' : ''}`}
                                    onClick={() => this.handleViewMessage(msg._id)}
                                >
                                    <div className="message-header">
                                        <span className="message-sender">{msg.name}</span>
                                        <span className="message-date">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="message-subject">{msg.subject}</div>
                                    <div className="message-preview">
                                        {msg.message.substring(0, 100)}{msg.message.length > 100 ? '...' : ''}
                                    </div>
                                    <div className="message-actions">
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => this.handleDeleteMessage(msg._id, e)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Message Detail Modal */}
                    {selectedMessage && (
                        <div className="message-modal-overlay">
                            <div className="message-modal">
                                <div className="modal-header">
                                    <h2>{selectedMessage.subject}</h2>
                                    <button className="close-btn" onClick={this.closeModal}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="detail-row">
                                        <strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})
                                    </div>
                                    <div className="detail-row">
                                        <strong>Sent on:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
                                    </div>
                                    <div className="message-content">
                                        {selectedMessage.message}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <a href={`mailto:${selectedMessage.email}`} className="reply-btn">Reply via Email</a>
                                    <button onClick={this.closeModal} className="close-action-btn">Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        );
    }
}

export default ManageMessages;
