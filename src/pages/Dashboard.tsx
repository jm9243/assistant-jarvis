import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Clock, TrendingUp, Video, Library } from 'lucide-react';
import './pages.css';

const Dashboard: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Dashboard</h2>
        <Link to="/recorder" className="btn btn-primary">
          <Plus size={18} />
          Start Recording
        </Link>
      </div>

      <div className="dashboard-grid">
        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <Play size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Workflows</div>
              <div className="stat-value">12</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Recent Tasks</div>
              <div className="stat-value">5</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">94%</div>
            </div>
          </div>
        </div>

        {/* Recent Workflows */}
        <section className="recent-section">
          <h3>Recent Workflows</h3>
          <div className="workflows-list">
            <div className="workflow-item">
              <div className="workflow-info">
                <h4>Web Form Automation</h4>
                <p>Updated 2 hours ago</p>
              </div>
              <Link to="/editor/1" className="btn btn-sm btn-secondary">
                Edit
              </Link>
            </div>

            <div className="workflow-item">
              <div className="workflow-info">
                <h4>File Processing</h4>
                <p>Updated 1 day ago</p>
              </div>
              <Link to="/editor/2" className="btn btn-sm btn-secondary">
                Edit
              </Link>
            </div>

            <div className="workflow-item">
              <div className="workflow-info">
                <h4>Email Bulk Send</h4>
                <p>Updated 3 days ago</p>
              </div>
              <Link to="/editor/3" className="btn btn-sm btn-secondary">
                Edit
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/recorder" className="quick-action-btn">
              <Video size={24} />
              <span>Record New</span>
            </Link>
            <Link to="/templates" className="quick-action-btn">
              <Library size={24} />
              <span>Templates</span>
            </Link>
            <Link to="/tasks" className="quick-action-btn">
              <Play size={24} />
              <span>Run Task</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
