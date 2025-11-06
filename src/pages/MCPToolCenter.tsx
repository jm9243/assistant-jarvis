import React from 'react';
import './pages.css';

const MCPToolCenter: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>MCP Tool Center</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Registered Tools</h3>
        <p style={{ color: '#999' }}>No tools registered yet.</p>
      </div>
    </div>
  );
};

export default MCPToolCenter;
