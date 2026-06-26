import { Component } from "react";
import "../styles/admin/AdminDashboard.css";
import api from "../api";

class StatCard extends Component {
  render() {
    const { icon, iconColor, label, value, change, changeType } = this.props;
    return (
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-label">{label}</div>
          <div className={`stat-icon ${iconColor}`}>
            <span className={`nav-icon ${icon}`}></span>
          </div>
        </div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${changeType}`}>
          <span className="arrow">
            {changeType === 'positive' ? '↗' : changeType === 'negative' ? '↘' : '→'}
          </span>
          <span>{change}</span>
          <span>vs last month</span>
        </div>
      </div>
    );
  }
}

class ActivityRow extends Component {
  render() {
    const { icon, iconColor, title, description, status, time } = this.props;
    return (
      <tr>
        <td>
          <div className="activity-event">
            <div className={`event-icon ${iconColor}`}>
              <span className={`activity-icon ${icon}`}></span>
            </div>
            <div className="event-info">
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          </div>
        </td>
        <td>
          <span className={`status-badge ${status.toLowerCase()}`}>
            {status}
          </span>
        </td>
        <td>
          <span className="time-text">{time}</span>
        </td>
      </tr>
    );
  }
}

class QuickAction extends Component {
  render() {
    const { icon, label, onClick } = this.props;
    return (
      <button className="action-btn" onClick={onClick}>
        <span className={`action-icon ${icon}`}></span>
        <span>{label}</span>
      </button>
    );
  }
}

class TaskItem extends Component {
  render() {
    const { icon, iconColor, title, description, actionText, onAction } = this.props;
    return (
      <div className="task-item">
        <div className="task-info">
          <div className={`task-icon ${iconColor}`}>
            <span className={`task-icon-span ${icon}`}></span>
          </div>
          <div className="task-details">
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
        </div>
        <button className="task-action" onClick={onAction}>{actionText}</button>
      </div>
    );
  }
}

class AdminHome extends Component {
  state = {
    stats: [],
    recentActivities: [],
    pendingTasks: []
  };


  componentDidMount() {
    this.fetchDashboardData();
  }

  fetchDashboardData = async () => {
    try {
      const res = await api.get("/admin/stats");
      console.log("ADMIN STATS RESPONSE:", res.data);

      const {
        totalUsers,
        totalBrands,
        totalProducts,
        pendingBrands,
        recentActivities
      } = res.data;

      this.setState({
        stats: [
          {
            icon: "icon-users",
            iconColor: "gray",
            label: "Total Users",
            value: totalUsers,
            change: "+12%",
            changeType: "positive"
          },
          {
            icon: "icon-store",
            iconColor: "gray",
            label: "Total Brands",
            value: totalBrands,
            change: "+5%",
            changeType: "positive"
          },
          {
            icon: "icon-products",
            iconColor: "gray",
            label: "Total Products",
            value: totalProducts,
            change: "+18%",
            changeType: "positive"
          }
        ],
        recentActivities: recentActivities || [],
        pendingTasks: [
          {
            icon: "icon-alert-warning",
            iconColor: "gray",
            title: "Brand Verifications",
            description: `${pendingBrands} new requests waiting`,
            actionText: "Review",
            onAction: () => window.location.href = "/admin/verifications"
          },
          {
            icon: "icon-alert-danger",
            iconColor: "gray",
            title: "Reported Items",
            description: "5 items flagged by users",
            actionText: "Review",
            onAction: () => window.location.href = "/admin/products"
          }
        ]
      });
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };


  handleQuickAction = (action) => {
    console.log(`Quick action clicked: ${action}`);
    // Add your action handler logic here
  }

  render() {
    const { stats, recentActivities, pendingTasks } = this.state;

    return (
      <div className="dashboard-content">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, Administrator. Here is your daily overview.</p>
          </div>
          <div className="date-filter">
            <span className="date-icon icon-calendar"></span>
            <span>Last 30 Days</span>
            <span className="dropdown-icon">▼</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Two Column Layout (Recent Activity Left, Tasks Right) */}
        <div className="two-column-layout">
          {/* Recent Activity */}
          <div className="activity-card">
            <div className="card-header">
              <h2 className="card-title">Recent Activity</h2>
              <a href="#" className="view-all-btn">View All</a>
            </div>

            <table className="activity-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, index) => (
                  <ActivityRow key={index} {...activity} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Tasks */}
          <div className="tasks-card">
            <div className="card-header">
              <h2 className="card-title">Pending Tasks</h2>
            </div>

            {pendingTasks.map((task, index) => (
              <TaskItem key={index} {...task} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default AdminHome;
