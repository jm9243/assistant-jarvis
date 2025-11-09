package model

import "time"

// User 用户模型
type User struct {
	ID                  string     `json:"id" db:"id"`
	Username            string     `json:"username" db:"username"`
	AvatarURL           string     `json:"avatar_url" db:"avatar_url"`
	MembershipLevel     string     `json:"membership_level" db:"membership_level"`
	MembershipExpiresAt *time.Time `json:"membership_expires_at" db:"membership_expires_at"`
	StorageQuotaMB      int        `json:"storage_quota_mb" db:"storage_quota_mb"`
	TokenQuota          int        `json:"token_quota" db:"token_quota"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
}

// Device 设备模型
type Device struct {
	ID           string     `json:"id" db:"id"`
	UserID       string     `json:"user_id" db:"user_id"`
	DeviceID     string     `json:"device_id" db:"device_id"`
	DeviceName   string     `json:"device_name" db:"device_name"`
	OSType       string     `json:"os_type" db:"os_type"`
	OSVersion    string     `json:"os_version" db:"os_version"`
	AppVersion   string     `json:"app_version" db:"app_version"`
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	LastOnlineAt *time.Time `json:"last_online_at" db:"last_online_at"`
	IsOnline     bool       `json:"is_online" db:"is_online"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// RegisterDeviceRequest 注册设备请求
type RegisterDeviceRequest struct {
	DeviceID   string `json:"device_id" binding:"required"`
	DeviceName string `json:"device_name"`
	OSType     string `json:"os_type" binding:"required"`
	OSVersion  string `json:"os_version"`
	AppVersion string `json:"app_version"`
}

// UpdateDeviceStatusRequest 更新设备状态请求
type UpdateDeviceStatusRequest struct {
	IsOnline bool `json:"is_online"`
}

