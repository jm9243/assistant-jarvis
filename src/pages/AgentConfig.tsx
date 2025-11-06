import React from 'react';
import './pages.css';

const AgentConfig: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Agent Configuration</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Agent Settings</h3>
        <p style={{ color: '#999' }}>Configure AI agent parameters here.</p>
      </div>
    </div>
  );
};

export default AgentConfig;
