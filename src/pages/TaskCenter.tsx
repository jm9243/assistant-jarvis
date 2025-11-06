import React from 'react';
import './pages.css';

const TaskCenter: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Task Center</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Task History</h3>
        <p style={{ color: '#999' }}>No tasks executed yet.</p>
      </div>
    </div>
  );
};

export default TaskCenter;
