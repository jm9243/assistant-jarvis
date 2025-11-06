import React, { useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import './pages.css';

const RecorderPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);

  const handleStartStop = () => {
    setIsRecording(!isRecording);
  };

  const handleReset = () => {
    setSteps([]);
    setIsRecording(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Recorder</h2>
      </div>

      <div className="recorder-container">
        <div className="recorder-controls">
          <div className="recorder-status">
            <div className={`status-indicator ${isRecording ? 'recording' : ''}`}></div>
            <span>{isRecording ? 'Recording...' : 'Ready'}</span>
          </div>

          <button
            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleStartStop}
          >
            {isRecording ? (
              <>
                <Square size={18} />
                Stop Recording
              </>
            ) : (
              <>
                <Play size={18} />
                Start Recording
              </>
            )}
          </button>

          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        <div className="steps-preview">
          <h3>Captured Steps ({steps.length})</h3>
          <div className="steps-list">
            {steps.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                Start recording to capture steps
              </p>
            ) : (
              steps.map((step, index) => (
                <div key={index} className="step-item">
                  <h4>Step {index + 1}: {step.type}</h4>
                  <p>{step.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecorderPage;
