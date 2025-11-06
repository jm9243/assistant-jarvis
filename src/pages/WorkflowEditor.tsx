import React from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Save } from 'lucide-react';
import './pages.css';

const WorkflowEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>{id ? 'Edit Workflow' : 'New Workflow'}</h2>
        <button className="btn btn-primary">
          <Save size={18} />
          Save Workflow
        </button>
      </div>

      <div className="editor-container">
        <div className="editor-canvas">
          <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>
            <p>Drag nodes here to build your workflow</p>
          </div>
        </div>

        <div className="editor-sidebar">
          <h3>Actions</h3>
          <button className="btn btn-block" style={{ width: '100%', marginBottom: '8px' }}>
            <Plus size={18} />
            Click
          </button>
          <button className="btn btn-block" style={{ width: '100%', marginBottom: '8px' }}>
            <Plus size={18} />
            Type Text
          </button>
          <button className="btn btn-block" style={{ width: '100%' }}>
            <Plus size={18} />
            Condition
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
