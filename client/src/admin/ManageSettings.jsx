import { Component } from "react";
import AdminLayout from "./AdminLayout";
import "../styles/admin/AdminSettings.css";

class ManageSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      storeProfile: {
        storeName: "FashionVerse",
        supportEmail: "support@fashionverse.com"
      },
      roles: [
        {
          id: 1,
          name: "Administrator",
          description: "Full access to all settings and store data."
        },
        {
          id: 2,
          name: "Editor",
          description: "Can manage catalog and orders, restricted settings."
        },
        {
          id: 3,
          name: "Viewer",
          description: "Read-only access to analytics and reports."
        }
      ],
      integrations: [
        {
          id: 1,
          name: "Stripe",
          description: "Payment processing gateway for handling transactions.",
          status: "connected",
          icon: "💳",
          color: "#635BFF"
        }
      ],
      securitySettings: {
        twoFactorAuth: false
      }
    };
  }

  handleStoreProfileChange = (field, value) => {
    this.setState(prevState => ({
      storeProfile: {
        ...prevState.storeProfile,
        [field]: value
      }
    }));
  }

  handle2FAToggle = () => {
    this.setState(prevState => ({
      securitySettings: {
        ...prevState.securitySettings,
        twoFactorAuth: !prevState.securitySettings.twoFactorAuth
      }
    }));
  }

  handleIntegrationAction = (integrationId, action) => {
    if (action === 'connect') {
      this.setState(prevState => ({
        integrations: prevState.integrations.map(integration =>
          integration.id === integrationId
            ? { ...integration, status: 'connected' }
            : integration
        )
      }));
      alert(`${prevState.integrations.find(i => i.id === integrationId).name} connected successfully!`);
    } else {
      console.log('Configure:', integrationId);
    }
  }

  handleSaveStoreProfile = () => {
    alert('Store profile saved successfully!');
  }

  render() {
    const { storeProfile, roles, integrations, securitySettings } = this.state;

    return (
      <AdminLayout breadcrumb={
        <>
          <span className="brand-link">FashionVerse Admin</span>
          <span className="separator">/</span>
          <span className="current">General Settings</span>
        </>
      }>
        <div className="dashboard-content">
          {/* Header */}
          <div className="settings-header">
            <div className="header-content">
              <div className="header-info">
                <h1>General Settings</h1>
                <p>
                  Manage your store's basic information and preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Store Profile Section */}
          <div className="settings-section">
            <div className="section-header-simple">
              <span className="section-icon">🏪</span>
              <h2>Store Profile</h2>
            </div>
            
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeProfile.storeName}
                  onChange={(e) => this.handleStoreProfileChange('storeName', e.target.value)}
                  placeholder="Enter store name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={storeProfile.supportEmail}
                  onChange={(e) => this.handleStoreProfileChange('supportEmail', e.target.value)}
                  placeholder="support@example.com"
                />
              </div>

              <div className="form-actions">
                <button className="save-btn" onClick={this.handleSaveStoreProfile}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Roles & Permissions Section */}
          <div className="settings-section">
            <div className="section-header-with-action">
              <div className="section-title-with-icon">
                <span className="section-icon">👥</span>
                <h2>Roles & Permissions</h2>
              </div>
              <button className="add-role-btn">
                + Add Role
              </button>
            </div>

            <div className="roles-table-container">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <span className="role-name">{role.name}</span>
                      </td>
                      <td>
                        <span className="role-description">{role.description}</span>
                      </td>
                      <td>
                        <button 
                          className="edit-role-btn"
                          onClick={() => console.log('Edit role:', role.id)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Integrations & Security Settings Section */}
          <div className="settings-section">
            <div className="section-header-simple">
              <span className="section-icon">🔗</span>
              <h2>Integrations & Security</h2>
            </div>

            <div className="integrations-security-grid">
              {/* Integrations */}
              {integrations.map((integration) => (
                <div key={integration.id} className="integration-card">
                  <div className="integration-header">
                    <div 
                      className="integration-icon" 
                      style={{ backgroundColor: integration.color }}
                    >
                      {integration.icon}
                    </div>
                    <div className={`integration-status ${integration.status}`}>
                      {integration.status === 'connected' ? '●' : '○'}
                    </div>
                  </div>
                  <div className="integration-content">
                    <h3 className="integration-name">{integration.name}</h3>
                    <p className="integration-description">{integration.description}</p>
                    <button
                      className={`integration-action ${integration.status === 'connected' ? 'configure' : 'connect'}`}
                      onClick={() => this.handleIntegrationAction(
                        integration.id,
                        integration.status === 'connected' ? 'configure' : 'connect'
                      )}
                    >
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Security Settings */}
              <div className="security-setting-item">
                <div className="security-header">
                  <span className="security-icon">🔒</span>
                </div>
                <div className="setting-info">
                  <div className="setting-title">Two-Factor Authentication (2FA)</div>
                  <div className="setting-description">Enforce 2FA for all administrator accounts.</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={this.handle2FAToggle}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
}

export default ManageSettings;

