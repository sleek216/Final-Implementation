import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/AdminUsers.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Users");
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, activeFilter, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter === 'Active') params.append('filter', 'active');
      else if (activeFilter === 'Inactive') params.append('filter', 'inactive');
      params.append('page', currentPage);
      params.append('limit', 10);
      
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users || response.data);
      setTotalUsers(response.data.total || response.data.length);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      alert("User role updated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
        alert("User deleted successfully");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getFilteredUsers = () => {
    return users; // Since filtering is now done on backend
  };

  const getStats = () => {
    const activeNow = users.filter(user => user.role !== "suspended").length;
    const newSignups = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length;
    const suspended = users.filter(user => user.role === "suspended").length;
    
    return { totalUsers, activeNow, newSignups, suspended };
  };

  if (loading) return <AdminLayout><div className="loading">Loading users...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="error">{error}</div></AdminLayout>;

  const filteredUsers = getFilteredUsers();
  const stats = getStats();

  return (
    <AdminLayout breadcrumb={
      <>
        <span className="brand-link">FashionVerse Admin</span>
        <span className="separator">/</span>
        <span className="current">User Management</span>
      </>
    }>
      <div className="dashboard-content">
        {/* Header */}
        <div className="user-management-header">
          <div className="header-content">
            <div className="header-info">
              <h1>User Management</h1>
              <p>
                Manage registered users, roles, and account statuses.
              </p>
            </div>
            <div className="header-actions">
              <button className="export-btn">
                📥 Export CSV
              </button>
              <button className="add-user-btn">
                + Add User
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="user-stats-grid">
          <div className="user-stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-change positive">
                ↗ +2.5% this month
              </div>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="stat-info">
              <div className="stat-label">Active Now</div>
              <div className="stat-value">{stats.activeNow}</div>
              <div className="stat-change neutral">
                ~10% of total users
              </div>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="stat-info">
              <div className="stat-label">New Signups</div>
              <div className="stat-value">{stats.newSignups}</div>
              <div className="stat-change positive">
                ↗ +12 today
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="user-controls">
          <div className="filter-tabs">
            {["All Users", "Active", "Inactive"].map((filter) => (
              <button 
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="search-controls">
            <input 
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
            <button className="filter-btn">
              🔍 Filter
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Password</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-text">No users found</div>
                      <div className="empty-state-subtext">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No users match the selected filters'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar-circle">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="role-label">{user.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}</div>
                  </td>
                  <td>
                    <div className="user-password">
                      {user.tempPassword ? (
                        <span className="password-tag">{user.tempPassword}</span>
                      ) : (
                        <span className="no-password">Encrypted</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="last-login">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-new status-${user.role === 'suspended' ? 'suspended' : 'active'}`}>
                      {user.role === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete User"
                        onClick={() => handleDelete(user._id)}
                        aria-label="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          
          <div className="table-footer">
            <div className="showing-text">
              Showing {filteredUsers.length} of {stats.totalUsers} users
            </div>
            <div className="pagination">
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages <= 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageUsers;