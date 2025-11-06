export enum Permission {
  RecordScreen = 'record-screen',
  AccessibilityAPI = 'accessibility-api',
  FileAccess = 'file-access',
  ClipboardAccess = 'clipboard-access',
  CameraAccess = 'camera-access',
  MicrophoneAccess = 'microphone-access',
  NetworkAccess = 'network-access',
}

export interface PermissionStatus {
  permission: Permission;
  granted: boolean;
  requestedAt?: Date;
  expiresAt?: Date;
}

export interface SensitiveData {
  type: 'password' | 'apikey' | 'token' | 'pii' | 'other';
  pattern: RegExp;
  maskChar?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  user?: string;
  resource?: string;
  details?: Record<string, any>;
  result: 'success' | 'failure';
}

export interface SecurityPolicy {
  enableDataMasking: boolean;
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  retentionDays: number;
}
