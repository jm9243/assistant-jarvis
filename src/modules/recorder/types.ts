export interface RecorderConfig {
  captureMouseMovement: boolean;
  captureScreenshots: boolean;
  captureKeystrokes: boolean;
  autoDetectElements: boolean;
}

export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  steps: RecordedStep[];
}

export interface RecordedStep {
  id: string;
  timestamp: Date;
  type: 'click' | 'type' | 'scroll' | 'drag' | 'wait' | 'screenshot' | 'keypress';
  element?: RecordedElement;
  data: Record<string, any>;
}

export interface RecordedElement {
  id: string;
  type: string;
  role: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  selector: ElementSelector;
  properties: Record<string, any>;
}

export interface ElementSelector {
  primary: string;
  fallback: string[];
  confidence: number;
}
