import { Permission, PermissionStatus } from './types';

export class PermissionManager {
  private permissions: Map<Permission, PermissionStatus> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Initialize all permissions as not granted
    for (const permission of Object.values(Permission)) {
      this.permissions.set(permission as Permission, {
        permission: permission as Permission,
        granted: false,
      });
    }
  }

  async requestPermission(permission: Permission): Promise<boolean> {
    const status = this.permissions.get(permission);
    if (!status) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (status.granted) {
      return true;
    }

    // In a real application, this would trigger the system permission dialog
    const granted = await this.showPermissionDialog(permission);

    if (granted) {
      status.granted = true;
      status.requestedAt = new Date();
      this.emit('permissionGranted', permission);
    } else {
      this.emit('permissionDenied', permission);
    }

    return granted;
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions.get(permission)?.granted || false;
  }

  revokePermission(permission: Permission): void {
    const status = this.permissions.get(permission);
    if (status) {
      status.granted = false;
      this.emit('permissionRevoked', permission);
    }
  }

  getAllPermissions(): PermissionStatus[] {
    return Array.from(this.permissions.values());
  }

  getGrantedPermissions(): Permission[] {
    return Array.from(this.permissions.values())
      .filter((p) => p.granted)
      .map((p) => p.permission);
  }

  private async showPermissionDialog(permission: Permission): Promise<boolean> {
    // Placeholder for permission dialog
    console.log(`Requesting permission: ${permission}`);
    return new Promise((resolve) => {
      // In production, this would show a native or web dialog
      setTimeout(() => {
        resolve(false); // Default to false for now
      }, 100);
    });
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(data);
    });
  }
}
