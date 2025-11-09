# Phase 6: 手机端 - 后台服务迭代计划（未来计划）

**阶段目标**: 为移动端提供轻量化API支持  
**预计时间**: 1个月  
**依赖**: Phase 1-5 后台服务完成  
**状态**: 📋 未来计划

---

## ⚠️ 重要说明

本阶段为**未来计划**，将在Phase 1-5完成并稳定运行后启动。本文档仅作为前期规划参考。

---

## 目录

1. [功能清单](#功能清单)
2. [核心功能详解](#核心功能详解)
3. [技术架构](#技术架构)
4. [开发计划](#开发计划)

---

## 功能清单

### 必须完成的功能模块

#### 1. 移动端专用API (对应PRD 5.2-5.7)
- [ ] Mobile Dashboard API（轻量版KPI）
- [ ] 工作流快捷控制API
- [ ] 任务轻量查询API
- [ ] Agent对话API（优化）

#### 2. 推送通知服务
- [ ] FCM/APNs集成
- [ ] 推送模板管理
- [ ] 推送发送API
- [ ] 推送历史记录

#### 3. 数据同步优化
- [ ] 增量数据同步
- [ ] 数据压缩
- [ ] 缓存策略

---

## 核心功能详解

### 1. Mobile Dashboard API

#### 1.1 轻量版KPI接口

```go
// handlers/mobile_dashboard.go
package handlers

type MobileDashboardResponse struct {
  KPIs           MobileKPIs        `json:"kpis"`
  RecentActivities []Activity      `json:"recent_activities"`
  Alerts         []Alert           `json:"alerts"`
  QuickActions   []QuickAction     `json:"quick_actions"`
}

type MobileKPIs struct {
  TodayExecutions int64   `json:"today_executions"`
  SuccessRate     float64 `json:"success_rate"`
  RunningTasks    int64   `json:"running_tasks"`
  FailedTasks     int64   `json:"failed_tasks"`
}

type Activity struct {
  ID          string `json:"id"`
  Type        string `json:"type"` // workflow_started, task_completed, etc.
  Title       string `json:"title"`
  Description string `json:"description"`
  Timestamp   string `json:"timestamp"`
  Status      string `json:"status"`
}

type Alert struct {
  ID       string `json:"id"`
  Level    string `json:"level"` // info, warning, error
  Title    string `json:"title"`
  Message  string `json:"message"`
  Link     string `json:"link,omitempty"`
  Created  string `json:"created_at"`
}

type QuickAction struct {
  ID          string `json:"id"`
  Type        string `json:"type"` // workflow, agent, view
  Title       string `json:"title"`
  Icon        string `json:"icon"`
  TargetID    string `json:"target_id"`
}

func GetMobileDashboard(c *gin.Context) {
  userID := c.GetString("user_id")
  
  response := MobileDashboardResponse{}
  
  // 1. 计算KPI（仅今日数据，减少查询负担）
  todayStart := time.Now().Truncate(24 * time.Hour)
  
  // 今日执行次数
  todayExecutions, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Gte("created_at", todayStart.Format(time.RFC3339)).
    Execute()
  response.KPIs.TodayExecutions = todayExecutions.Count
  
  // 成功率（今日）
  successCount, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Eq("status", "completed").
    Gte("created_at", todayStart.Format(time.RFC3339)).
    Execute()
  
  if todayExecutions.Count > 0 {
    response.KPIs.SuccessRate = float64(successCount.Count) / float64(todayExecutions.Count) * 100
  }
  
  // 运行中任务
  runningTasks, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Eq("status", "running").
    Execute()
  response.KPIs.RunningTasks = runningTasks.Count
  
  // 失败任务（今日）
  failedTasks, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Eq("status", "failed").
    Gte("created_at", todayStart.Format(time.RFC3339)).
    Execute()
  response.KPIs.FailedTasks = failedTasks.Count
  
  // 2. 最近活动（限制10条）
  activities, _ := db.From("logs").
    Select("*").
    Eq("user_id", userID).
    In("action", []string{"workflow_started", "task_completed", "task_failed", "agent_created"}).
    Order("created_at", &supabase.OrderOpts{Ascending: false}).
    Limit(10).
    Execute()
  
  for _, log := range activities.Data {
    response.RecentActivities = append(response.RecentActivities, Activity{
      ID:          log["id"].(string),
      Type:        log["action"].(string),
      Title:       log["title"].(string),
      Description: log["description"].(string),
      Timestamp:   log["created_at"].(string),
      Status:      log["status"].(string),
    })
  }
  
  // 3. 告警（仅高优先级，限制5条）
  alerts, _ := db.From("alerts").
    Select("*").
    Eq("user_id", userID).
    Eq("resolved", false).
    In("level", []string{"warning", "error"}).
    Order("created_at", &supabase.OrderOpts{Ascending: false}).
    Limit(5).
    Execute()
  
  for _, alert := range alerts.Data {
    response.Alerts = append(response.Alerts, Alert{
      ID:      alert["id"].(string),
      Level:   alert["level"].(string),
      Title:   alert["title"].(string),
      Message: alert["message"].(string),
      Created: alert["created_at"].(string),
    })
  }
  
  // 4. 快捷操作（常用工作流）
  favoriteWorkflows, _ := db.From("workflows").
    Select("id, name, icon").
    Eq("user_id", userID).
    Eq("is_favorite", true).
    Eq("enabled", true).
    Limit(5).
    Execute()
  
  for _, wf := range favoriteWorkflows.Data {
    response.QuickActions = append(response.QuickActions, QuickAction{
      ID:       wf["id"].(string),
      Type:     "workflow",
      Title:    wf["name"].(string),
      Icon:     wf["icon"].(string),
      TargetID: wf["id"].(string),
    })
  }
  
  c.JSON(http.StatusOK, response)
}
```

---

### 2. 推送通知服务

#### 2.1 FCM推送集成

```go
// services/push_notification.go
package services

import (
  "context"
  firebase "firebase.google.com/go/v4"
  "firebase.google.com/go/v4/messaging"
  "google.golang.org/api/option"
)

type PushNotificationService struct {
  fcmClient *messaging.Client
}

func NewPushNotificationService() (*PushNotificationService, error) {
  opt := option.WithCredentialsFile("path/to/serviceAccountKey.json")
  app, err := firebase.NewApp(context.Background(), nil, opt)
  if err != nil {
    return nil, err
  }
  
  client, err := app.Messaging(context.Background())
  if err != nil {
    return nil, err
  }
  
  return &PushNotificationService{
    fcmClient: client,
  }, nil
}

func (s *PushNotificationService) SendNotification(ctx context.Context, req SendNotificationRequest) error {
  // 获取用户的设备Token
  deviceTokens := getUserDeviceTokens(req.UserID)
  
  if len(deviceTokens) == 0 {
    return fmt.Errorf("no device tokens found for user %s", req.UserID)
  }
  
  // 构建消息
  message := &messaging.MulticastMessage{
    Notification: &messaging.Notification{
      Title: req.Title,
      Body:  req.Body,
    },
    Data: req.Data,
    Tokens: deviceTokens,
    Android: &messaging.AndroidConfig{
      Priority: "high",
      Notification: &messaging.AndroidNotification{
        Sound:        "default",
        ChannelID:    req.ChannelID,
        Priority:     "high",
      },
    },
    APNS: &messaging.APNSConfig{
      Headers: map[string]string{
        "apns-priority": "10",
      },
      Payload: &messaging.APNSPayload{
        Aps: &messaging.Aps{
          Alert: &messaging.ApsAlert{
            Title: req.Title,
            Body:  req.Body,
          },
          Sound: "default",
          Badge: req.Badge,
        },
      },
    },
  }
  
  // 发送
  response, err := s.fcmClient.SendMulticast(ctx, message)
  if err != nil {
    return err
  }
  
  // 记录发送结果
  logPushNotification(req.UserID, req.Title, response.SuccessCount, response.FailureCount)
  
  // 清理无效Token
  if response.FailureCount > 0 {
    for idx, resp := range response.Responses {
      if !resp.Success {
        removeDeviceToken(req.UserID, deviceTokens[idx])
      }
    }
  }
  
  return nil
}

type SendNotificationRequest struct {
  UserID    string            `json:"user_id"`
  Title     string            `json:"title"`
  Body      string            `json:"body"`
  Data      map[string]string `json:"data"`
  ChannelID string            `json:"channel_id"`
  Badge     *int              `json:"badge,omitempty"`
}

func getUserDeviceTokens(userID string) []string {
  var tokens []string
  
  result, _ := db.From("device_tokens").
    Select("token").
    Eq("user_id", userID).
    Eq("active", true).
    Execute()
  
  for _, row := range result.Data {
    tokens = append(tokens, row["token"].(string))
  }
  
  return tokens
}
```

---

#### 2.2 推送触发规则

```go
// handlers/push_triggers.go
package handlers

// 工作流执行完成后推送
func onWorkflowCompleted(task Task) {
  // 检查用户推送设置
  settings := getUserPushSettings(task.UserID)
  
  if !settings.WorkflowCompletion {
    return
  }
  
  // 发送推送
  pushService.SendNotification(context.Background(), SendNotificationRequest{
    UserID:    task.UserID,
    Title:     "工作流执行完成",
    Body:      fmt.Sprintf("工作流「%s」已完成", task.WorkflowName),
    ChannelID: "workflow_completion",
    Data: map[string]string{
      "type":    "task_completed",
      "task_id": task.ID,
    },
  })
}

// 工作流执行失败后推送
func onWorkflowFailed(task Task) {
  settings := getUserPushSettings(task.UserID)
  
  if !settings.WorkflowFailure {
    return
  }
  
  pushService.SendNotification(context.Background(), SendNotificationRequest{
    UserID:    task.UserID,
    Title:     "⚠️ 工作流执行失败",
    Body:      fmt.Sprintf("工作流「%s」执行失败", task.WorkflowName),
    ChannelID: "workflow_failure",
    Data: map[string]string{
      "type":    "task_failed",
      "task_id": task.ID,
    },
  })
}

// 系统告警推送
func onSystemAlert(alert Alert) {
  settings := getUserPushSettings(alert.UserID)
  
  if !settings.SystemAlerts {
    return
  }
  
  pushService.SendNotification(context.Background(), SendNotificationRequest{
    UserID:    alert.UserID,
    Title:     "系统告警",
    Body:      alert.Message,
    ChannelID: "system_alerts",
    Data: map[string]string{
      "type":     "alert",
      "alert_id": alert.ID,
      "level":    alert.Level,
    },
  })
}
```

---

### 3. 移动端API路由

```go
// routes/mobile.go
func SetupMobileRoutes(router *gin.Engine, db *supabase.Client) {
  auth := middleware.AuthMiddleware(db)
  
  mobile := router.Group("/api/v1/mobile")
  mobile.Use(auth)
  {
    // Dashboard
    mobile.GET("/dashboard", handlers.GetMobileDashboard)
    
    // 工作流快捷控制
    mobile.GET("/workflows/quick", handlers.GetQuickWorkflows)
    mobile.POST("/workflows/:id/start", handlers.QuickStartWorkflow)
    mobile.POST("/workflows/:id/stop", handlers.QuickStopWorkflow)
    
    // 任务轻量查询
    mobile.GET("/tasks", handlers.GetMobileTasks)
    mobile.GET("/tasks/:id", handlers.GetMobileTaskDetail)
    mobile.POST("/tasks/:id/retry", handlers.RetryTask)
    mobile.DELETE("/tasks/:id", handlers.DeleteTask)
    
    // Agent对话（优化版）
    mobile.GET("/agents", handlers.GetMobileAgents)
    mobile.POST("/agents/:id/chat", handlers.MobileAgentChat)
    mobile.GET("/agents/:id/history", handlers.GetChatHistory)
    
    // 通知
    mobile.GET("/notifications", handlers.GetMobileNotifications)
    mobile.PUT("/notifications/:id/read", handlers.MarkNotificationRead)
    mobile.PUT("/notifications/read-all", handlers.MarkAllNotificationsRead)
    
    // 设备管理
    mobile.POST("/devices/register", handlers.RegisterDevice)
    mobile.DELETE("/devices/:token", handlers.UnregisterDevice)
    
    // 推送设置
    mobile.GET("/push-settings", handlers.GetPushSettings)
    mobile.PUT("/push-settings", handlers.UpdatePushSettings)
  }
}
```

---

### 4. 数据库Schema扩展

#### 4.1 设备Token表

```sql
-- 设备Token表
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 设备信息
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id TEXT NOT NULL,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- 状态
  active BOOLEAN DEFAULT TRUE,
  
  -- 时间
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_token ON device_tokens(token);
CREATE UNIQUE INDEX idx_device_tokens_user_device ON device_tokens(user_id, device_id);
```

---

#### 4.2 推送设置表

```sql
-- 推送设置表
CREATE TABLE push_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 推送开关
  workflow_completion BOOLEAN DEFAULT TRUE,
  workflow_failure BOOLEAN DEFAULT TRUE,
  system_alerts BOOLEAN DEFAULT TRUE,
  agent_reply BOOLEAN DEFAULT TRUE,
  
  -- 免打扰时段
  do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE push_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push settings"
  ON push_settings FOR ALL
  USING (auth.uid() = user_id);
```

---

#### 4.3 推送历史表

```sql
-- 推送历史表
CREATE TABLE push_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 推送内容
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  channel_id TEXT,
  
  -- 发送状态
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  -- 时间
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE push_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push history"
  ON push_history FOR SELECT
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_push_history_user_id ON push_history(user_id);
CREATE INDEX idx_push_history_sent_at ON push_history(sent_at DESC);
```

---

## 技术架构

### 推送通知架构

```
┌────────────────────────────────────────────────────────┐
│                  后台服务                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │           推送通知服务                            │ │
│  │                                                   │ │
│  │  - Firebase Cloud Messaging (FCM)                │ │
│  │  - Apple Push Notification Service (APNs)        │ │
│  │  - 推送规则引擎                                   │ │
│  │  - 推送历史记录                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │          移动端轻量API                            │ │
│  │                                                   │ │
│  │  - Mobile Dashboard API                           │ │
│  │  - 工作流快捷控制API                              │ │
│  │  - 任务轻量查询API                                │ │
│  │  - Agent对话API                                   │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                        ↓
             ┌──────────────────────┐
             │    移动端应用         │
             │  (iOS / Android)     │
             └──────────────────────┘
```

---

## 开发计划

### 时间线（共1个月）

#### Week 1-2: 移动端API

- [ ] Mobile Dashboard API
- [ ] 工作流快捷控制API
- [ ] 任务轻量查询API
- [ ] Agent对话API优化

---

#### Week 3-4: 推送通知

- [ ] FCM/APNs集成
- [ ] 推送服务开发
- [ ] 推送规则引擎
- [ ] 设备Token管理
- [ ] 推送设置API
- [ ] 测试与上线

---

## 验收标准

### 功能性验收

- [ ] 所有Mobile API正常工作
- [ ] 推送通知正常发送
- [ ] 设备Token正常管理

### 性能验收

- [ ] Mobile API响应时间 < 150ms (P95)
- [ ] 推送延迟 < 3秒

---

## 交付物清单

- [ ] Go后端源代码（Mobile API + 推送服务）
- [ ] Firebase配置文件
- [ ] API文档
- [ ] 测试代码

---

**文档状态**: 📋 未来计划  
**最后更新**: 2025-11-08

**说明**: 本文档为前期规划，实际开发前需根据Phase 1-5的反馈进行调整。

