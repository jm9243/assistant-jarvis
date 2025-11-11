# Phase 4: Multi-Agent协同 - 后台服务迭代计划

**阶段目标**: 支持Multi-Agent协同的后台服务扩展  
**预计时间**: 2.5个月  
**依赖**: Phase 2 后台服务完成

---

## 目录

1. [功能清单](#功能清单)
2. [核心功能详解](#核心功能详解)
3. [技术架构](#技术架构)
4. [开发计划](#开发计划)
5. [验收标准](#验收标准)

---

## 功能清单

### 必须完成的功能模块

#### 1. Multi-Agent协同API (对应PRD 4.5)
- [ ] 工作流编排API
- [ ] 组织架构API
- [ ] Supervisor模式API
- [ ] 会议模式API
- [ ] 协同状态同步

#### 2. 协同数据存储 (扩展Supabase Schema)
- [ ] 组织架构表
- [ ] Multi-Agent任务表
- [ ] 会议记录表
- [ ] 协同消息表
- [ ] 审批记录表

#### 3. 工具审批服务 (对应PRD 4.9.2)
- [ ] 审批请求创建
- [ ] 审批决策处理
- [ ] 审批规则引擎
- [ ] 审批历史记录

#### 4. 运营治理API (对应PRD 4.9.3)
- [ ] KPI指标查询
- [ ] 审计日志API
- [ ] 趋势分析API
- [ ] 告警管理API

#### 5. 实时协同通信
- [ ] Multi-Agent消息广播
- [ ] 协同状态推送
- [ ] 审批请求通知

---

## 核心功能详解

### 1. Supabase Schema扩展

#### 1.1 组织架构表

```sql
-- 组织架构表
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- 层级配置
  hierarchy JSONB NOT NULL DEFAULT '{"directors":[],"managers":[],"employees":[]}',
  
  -- 工作流程配置
  workflow_config JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations"
  ON organizations FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);
```

---

#### 1.2 Multi-Agent任务表

```sql
-- Multi-Agent任务表
CREATE TABLE multi_agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_task_id UUID REFERENCES multi_agent_tasks(id),
  
  -- 任务信息
  title TEXT NOT NULL,
  description TEXT,
  input JSONB,
  
  -- 分配信息
  assigned_to UUID REFERENCES agents(id),
  assigned_by UUID REFERENCES agents(id),
  assigned_at TIMESTAMPTZ,
  
  -- 执行信息
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'failed')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- 结果
  result JSONB,
  error TEXT,
  
  -- 审核信息
  review JSONB,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE multi_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own multi-agent tasks"
  ON multi_agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own multi-agent tasks"
  ON multi_agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own multi-agent tasks"
  ON multi_agent_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_multi_agent_tasks_user_id ON multi_agent_tasks(user_id);
CREATE INDEX idx_multi_agent_tasks_parent_task_id ON multi_agent_tasks(parent_task_id);
CREATE INDEX idx_multi_agent_tasks_assigned_to ON multi_agent_tasks(assigned_to);
CREATE INDEX idx_multi_agent_tasks_status ON multi_agent_tasks(status);
CREATE INDEX idx_multi_agent_tasks_created_at ON multi_agent_tasks(created_at DESC);
```

---

#### 1.3 会议记录表

```sql
-- 会议表
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- 会议信息
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('free_discussion', 'decision_making', 'brainstorming', 'diagnosis')),
  
  -- 参与者
  moderator_id UUID REFERENCES agents(id),
  participant_ids UUID[] NOT NULL,
  observer_ids UUID[],
  
  -- 会议配置
  rules JSONB NOT NULL DEFAULT '{}',
  
  -- 执行信息
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- 秒
  
  -- 会议纪要
  minutes JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_started_at ON meetings(started_at DESC);
```

---

#### 1.4 会议消息表

```sql
-- 会议消息表
CREATE TABLE meeting_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  
  -- 消息信息
  speaker_id UUID REFERENCES agents(id) NOT NULL,
  speaker_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('statement', 'question', 'answer', 'proposal', 'vote', 'summary')),
  
  -- 回复关系
  reply_to UUID REFERENCES meeting_messages(id),
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE meeting_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own meetings"
  ON meeting_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_messages.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own meetings"
  ON meeting_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_messages.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- 索引
CREATE INDEX idx_meeting_messages_meeting_id ON meeting_messages(meeting_id);
CREATE INDEX idx_meeting_messages_created_at ON meeting_messages(created_at ASC);
```

---

#### 1.5 审批记录表

```sql
-- 审批记录表
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- 请求信息
  requester_id UUID REFERENCES agents(id) NOT NULL,
  requester_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('tool_call', 'action', 'resource_access')),
  
  -- 工具调用信息（如果是工具调用）
  tool_name TEXT,
  tool_type TEXT,
  tool_params JSONB,
  
  -- 请求原因
  reason TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_message TEXT,
  
  -- 审批决策
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  decision_at TIMESTAMPTZ,
  decision_by TEXT, -- 'user' or 'auto_rule'
  decision_reason TEXT,
  
  -- 自动规则
  auto_rule_id UUID,
  
  -- 有效期
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approval requests"
  ON approval_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own approval requests"
  ON approval_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_approval_requests_user_id ON approval_requests(user_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at DESC);
```

---

### 2. Multi-Agent协同API

#### 2.1 工作流编排API

**路由定义**:
```go
// routes/multi_agent.go
func SetupMultiAgentRoutes(router *gin.Engine, db *supabase.Client) {
  auth := middleware.AuthMiddleware(db)
  
  group := router.Group("/api/v1/multi-agent")
  group.Use(auth)
  {
    // 组织架构
    group.POST("/organizations", handlers.CreateOrganization)
    group.GET("/organizations", handlers.ListOrganizations)
    group.GET("/organizations/:id", handlers.GetOrganization)
    group.PUT("/organizations/:id", handlers.UpdateOrganization)
    group.DELETE("/organizations/:id", handlers.DeleteOrganization)
    
    // Multi-Agent任务
    group.POST("/tasks", handlers.CreateMultiAgentTask)
    group.GET("/tasks", handlers.ListMultiAgentTasks)
    group.GET("/tasks/:id", handlers.GetMultiAgentTask)
    group.PUT("/tasks/:id", handlers.UpdateMultiAgentTask)
    group.POST("/tasks/:id/subtasks", handlers.CreateSubtask)
    group.POST("/tasks/:id/review", handlers.ReviewTask)
    
    // 会议
    group.POST("/meetings", handlers.CreateMeeting)
    group.GET("/meetings", handlers.ListMeetings)
    group.GET("/meetings/:id", handlers.GetMeeting)
    group.PUT("/meetings/:id", handlers.UpdateMeeting)
    group.POST("/meetings/:id/start", handlers.StartMeeting)
    group.POST("/meetings/:id/end", handlers.EndMeeting)
    group.POST("/meetings/:id/messages", handlers.AddMeetingMessage)
    group.GET("/meetings/:id/messages", handlers.GetMeetingMessages)
    group.GET("/meetings/:id/minutes", handlers.GetMeetingMinutes)
  }
}
```

---

#### 2.2 组织架构Handler

```go
// handlers/organization.go
package handlers

import (
  "net/http"
  "github.com/gin-gonic/gin"
)

type Organization struct {
  ID          string                 `json:"id"`
  UserID      string                 `json:"user_id"`
  Name        string                 `json:"name"`
  Description string                 `json:"description"`
  Hierarchy   map[string]interface{} `json:"hierarchy"`
  WorkflowConfig map[string]interface{} `json:"workflow_config"`
  CreatedAt   string                 `json:"created_at"`
  UpdatedAt   string                 `json:"updated_at"`
}

func CreateOrganization(c *gin.Context) {
  var req struct {
    Name        string                 `json:"name" binding:"required"`
    Description string                 `json:"description"`
    Hierarchy   map[string]interface{} `json:"hierarchy" binding:"required"`
    WorkflowConfig map[string]interface{} `json:"workflow_config"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  userID := c.GetString("user_id")
  
  // 插入数据库
  org := Organization{
    UserID:      userID,
    Name:        req.Name,
    Description: req.Description,
    Hierarchy:   req.Hierarchy,
    WorkflowConfig: req.WorkflowConfig,
  }
  
  result, err := db.From("organizations").Insert(org).Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
    return
  }
  
  c.JSON(http.StatusCreated, result)
}

func ListOrganizations(c *gin.Context) {
  userID := c.GetString("user_id")
  
  result, err := db.From("organizations").
    Select("*").
    Eq("user_id", userID).
    Order("created_at", &supabase.OrderOpts{Ascending: false}).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
    return
  }
  
  c.JSON(http.StatusOK, result)
}
```

---

### 3. 工具审批服务

#### 3.1 审批请求Handler

```go
// handlers/approval.go
package handlers

type ApprovalRequest struct {
  ID            string                 `json:"id"`
  UserID        string                 `json:"user_id"`
  RequesterID   string                 `json:"requester_id"`
  RequesterName string                 `json:"requester_name"`
  RequestType   string                 `json:"request_type"`
  ToolName      string                 `json:"tool_name,omitempty"`
  ToolType      string                 `json:"tool_type,omitempty"`
  ToolParams    map[string]interface{} `json:"tool_params,omitempty"`
  Reason        string                 `json:"reason"`
  RiskLevel     string                 `json:"risk_level"`
  RiskMessage   string                 `json:"risk_message,omitempty"`
  Status        string                 `json:"status"`
  CreatedAt     string                 `json:"created_at"`
}

func CreateApprovalRequest(c *gin.Context) {
  var req struct {
    RequesterID   string                 `json:"requester_id" binding:"required"`
    RequesterName string                 `json:"requester_name" binding:"required"`
    RequestType   string                 `json:"request_type" binding:"required"`
    ToolName      string                 `json:"tool_name"`
    ToolType      string                 `json:"tool_type"`
    ToolParams    map[string]interface{} `json:"tool_params"`
    Reason        string                 `json:"reason" binding:"required"`
    RiskLevel     string                 `json:"risk_level"`
    RiskMessage   string                 `json:"risk_message"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  userID := c.GetString("user_id")
  
  // 检查是否有自动审批规则
  autoApproved, ruleID := checkAutoApprovalRules(userID, req)
  
  approval := ApprovalRequest{
    UserID:        userID,
    RequesterID:   req.RequesterID,
    RequesterName: req.RequesterName,
    RequestType:   req.RequestType,
    ToolName:      req.ToolName,
    ToolType:      req.ToolType,
    ToolParams:    req.ToolParams,
    Reason:        req.Reason,
    RiskLevel:     req.RiskLevel,
    RiskMessage:   req.RiskMessage,
    Status:        "pending",
  }
  
  if autoApproved {
    approval.Status = "approved"
    approval.DecisionBy = "auto_rule"
    approval.AutoRuleID = ruleID
    approval.DecisionAt = time.Now().Format(time.RFC3339)
  }
  
  result, err := db.From("approval_requests").Insert(approval).Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create approval request"})
    return
  }
  
  // 如果不是自动审批，通过WebSocket通知用户
  if !autoApproved {
    notifyUserApprovalRequest(userID, approval)
  }
  
  c.JSON(http.StatusCreated, result)
}

func HandleApprovalDecision(c *gin.Context) {
  approvalID := c.Param("id")
  
  var req struct {
    Decision string `json:"decision" binding:"required,oneof=approved rejected"`
    Reason   string `json:"reason"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  userID := c.GetString("user_id")
  
  // 更新审批状态
  update := map[string]interface{}{
    "status":          req.Decision,
    "decision_at":     time.Now().Format(time.RFC3339),
    "decision_by":     "user",
    "decision_reason": req.Reason,
    "updated_at":      time.Now().Format(time.RFC3339),
  }
  
  result, err := db.From("approval_requests").
    Update(update).
    Eq("id", approvalID).
    Eq("user_id", userID).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update approval"})
    return
  }
  
  // 通知请求者
  notifyApprovalDecision(userID, approvalID, req.Decision)
  
  c.JSON(http.StatusOK, result)
}

// 自动审批规则检查
func checkAutoApprovalRules(userID string, req interface{}) (bool, string) {
  // TODO: 实现自动审批规则逻辑
  // 1. 查询用户的自动审批规则
  // 2. 匹配规则条件
  // 3. 返回是否自动批准和规则ID
  
  return false, ""
}
```

---

### 4. 运营治理API

#### 4.1 KPI指标Handler

```go
// handlers/governance.go
package handlers

type KPIMetrics struct {
  AgentCalls       int64   `json:"agent_calls"`
  AgentCallsTrend  float64 `json:"agent_calls_trend"`
  ToolCalls        int64   `json:"tool_calls"`
  ToolCallsTrend   float64 `json:"tool_calls_trend"`
  SuccessRate      float64 `json:"success_rate"`
  SuccessRateTrend float64 `json:"success_rate_trend"`
  AvgResponseTime  float64 `json:"avg_response_time"`
  AvgResponseTimeTrend float64 `json:"avg_response_time_trend"`
  
  CallsTrend       []DataPoint `json:"calls_trend"`
  PerformanceTrend []DataPoint `json:"performance_trend"`
  AuditLogs        []AuditLog  `json:"audit_logs"`
}

type DataPoint struct {
  Timestamp string  `json:"timestamp"`
  Value     float64 `json:"value"`
}

type AuditLog struct {
  ID        string `json:"id"`
  Timestamp string `json:"timestamp"`
  AgentName string `json:"agent_name"`
  ToolName  string `json:"tool_name"`
  Action    string `json:"action"`
  Status    string `json:"status"`
  Duration  int64  `json:"duration"`
}

func GetKPIMetrics(c *gin.Context) {
  userID := c.GetString("user_id")
  
  // 时间范围
  timeRange := c.DefaultQuery("range", "7d") // 7d, 30d, 90d
  
  metrics := KPIMetrics{}
  
  // 1. Agent调用量
  agentCalls, err := calculateAgentCalls(userID, timeRange)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate agent calls"})
    return
  }
  metrics.AgentCalls = agentCalls
  
  // 2. 工具调用量
  toolCalls, err := calculateToolCalls(userID, timeRange)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate tool calls"})
    return
  }
  metrics.ToolCalls = toolCalls
  
  // 3. 成功率
  successRate, err := calculateSuccessRate(userID, timeRange)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate success rate"})
    return
  }
  metrics.SuccessRate = successRate
  
  // 4. 平均响应时间
  avgResponseTime, err := calculateAvgResponseTime(userID, timeRange)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate avg response time"})
    return
  }
  metrics.AvgResponseTime = avgResponseTime
  
  // 5. 趋势数据
  callsTrend, err := getCallsTrend(userID, timeRange)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get calls trend"})
    return
  }
  metrics.CallsTrend = callsTrend
  
  // 6. 审计日志
  auditLogs, err := getRecentAuditLogs(userID, 50)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get audit logs"})
    return
  }
  metrics.AuditLogs = auditLogs
  
  c.JSON(http.StatusOK, metrics)
}

func GetAuditLogs(c *gin.Context) {
  userID := c.GetString("user_id")
  
  // 分页参数
  page := c.DefaultQuery("page", "1")
  pageSize := c.DefaultQuery("page_size", "20")
  
  // 过滤参数
  agentID := c.Query("agent_id")
  toolName := c.Query("tool_name")
  status := c.Query("status")
  startTime := c.Query("start_time")
  endTime := c.Query("end_time")
  
  // 构建查询
  query := db.From("audit_logs").
    Select("*").
    Eq("user_id", userID)
  
  if agentID != "" {
    query = query.Eq("agent_id", agentID)
  }
  if toolName != "" {
    query = query.Eq("tool_name", toolName)
  }
  if status != "" {
    query = query.Eq("status", status)
  }
  if startTime != "" {
    query = query.Gte("created_at", startTime)
  }
  if endTime != "" {
    query = query.Lte("created_at", endTime)
  }
  
  query = query.Order("created_at", &supabase.OrderOpts{Ascending: false})
  
  result, err := query.Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
    return
  }
  
  c.JSON(http.StatusOK, result)
}
```

---

### 5. WebSocket实时推送

#### 5.1 审批通知推送

```go
// websocket/notifications.go
package websocket

func notifyUserApprovalRequest(userID string, approval ApprovalRequest) {
  message := WSMessage{
    Type: "approval_request",
    Data: approval,
  }
  
  hub.BroadcastToUser(userID, message)
}

func notifyApprovalDecision(userID string, approvalID string, decision string) {
  message := WSMessage{
    Type: "approval_decision",
    Data: map[string]interface{}{
      "approval_id": approvalID,
      "decision":    decision,
    },
  }
  
  hub.BroadcastToUser(userID, message)
}

func notifyMeetingUpdate(userID string, meetingID string, update map[string]interface{}) {
  message := WSMessage{
    Type: "meeting_update",
    Data: map[string]interface{}{
      "meeting_id": meetingID,
      "update":     update,
    },
  }
  
  hub.BroadcastToUser(userID, message)
}
```

---

## 技术架构

### 后台服务扩展架构

```
┌───────────────────────────────────────────────────────────┐
│                 Go Backend Service 扩展                    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Multi-Agent API Layer                    │ │
│  │                                                       │ │
│  │  - 组织架构API                                        │ │
│  │  - Multi-Agent任务API                                 │ │
│  │  - 会议API                                            │ │
│  │  - 审批API                                            │ │
│  │  - 治理API                                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                         ↓                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               Supabase扩展表                          │ │
│  │                                                       │ │
│  │  - organizations                                      │ │
│  │  - multi_agent_tasks                                  │ │
│  │  - meetings                                           │ │
│  │  - meeting_messages                                   │ │
│  │  - approval_requests                                  │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## 开发计划

### 时间线（共2.5个月）

#### 第1个月：数据层与基础API

**Week 1-2: Supabase Schema扩展**
- [ ] 设计并创建5张新表
- [ ] 配置RLS策略
- [ ] 创建索引
- [ ] 编写迁移脚本

**Week 3-4: 基础API开发**
- [ ] 组织架构API
- [ ] Multi-Agent任务API
- [ ] 会议API（基础）

---

#### 第2个月：高级功能API

**Week 5-6: 审批与治理**
- [ ] 工具审批API
- [ ] 自动审批规则引擎
- [ ] KPI指标API
- [ ] 审计日志API

**Week 7-8: WebSocket推送**
- [ ] 审批通知推送
- [ ] 会议更新推送
- [ ] 任务状态推送

---

#### 第3个月：测试与上线

**Week 9-10: 测试与优化**
- [ ] API测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] Bug修复
- [ ] 文档完善

---

### 开发任务分配建议

**后端团队（2人）**:
- 工程师A: Supabase Schema、组织架构API、Multi-Agent任务API
- 工程师B: 会议API、审批API、治理API、WebSocket

---

## 验收标准

### 功能性验收

#### 1. 数据存储
- [ ] 5张表创建成功
- [ ] RLS策略正常工作
- [ ] 数据CRUD正常

#### 2. API功能
- [ ] 组织架构API正常
- [ ] Multi-Agent任务API正常
- [ ] 会议API正常
- [ ] 审批API正常
- [ ] 治理API正常

#### 3. 实时通信
- [ ] WebSocket推送正常
- [ ] 通知及时送达

---

### 性能验收

- [ ] API响应时间 < 200ms (P95)
- [ ] 数据库查询优化
- [ ] 并发支持 > 100 QPS

---

### 安全验收

- [ ] RLS策略有效
- [ ] 敏感数据加密
- [ ] 审计日志完整

---

## 交付物清单

### 代码交付物
- [ ] Go后端源代码（Multi-Agent模块）
- [ ] Supabase迁移脚本
- [ ] API测试代码

### 文档交付物
- [ ] API文档
- [ ] 数据库Schema文档
- [ ] 部署文档

---

## 附录

### 附录A: API接口列表

#### 组织架构
- `POST /api/v1/multi-agent/organizations` - 创建组织架构
- `GET /api/v1/multi-agent/organizations` - 获取组织架构列表
- `GET /api/v1/multi-agent/organizations/:id` - 获取组织架构详情
- `PUT /api/v1/multi-agent/organizations/:id` - 更新组织架构
- `DELETE /api/v1/multi-agent/organizations/:id` - 删除组织架构

#### Multi-Agent任务
- `POST /api/v1/multi-agent/tasks` - 创建任务
- `GET /api/v1/multi-agent/tasks` - 获取任务列表
- `GET /api/v1/multi-agent/tasks/:id` - 获取任务详情
- `PUT /api/v1/multi-agent/tasks/:id` - 更新任务
- `POST /api/v1/multi-agent/tasks/:id/subtasks` - 创建子任务
- `POST /api/v1/multi-agent/tasks/:id/review` - 审核任务

#### 会议
- `POST /api/v1/multi-agent/meetings` - 创建会议
- `GET /api/v1/multi-agent/meetings` - 获取会议列表
- `GET /api/v1/multi-agent/meetings/:id` - 获取会议详情
- `PUT /api/v1/multi-agent/meetings/:id` - 更新会议
- `POST /api/v1/multi-agent/meetings/:id/start` - 开始会议
- `POST /api/v1/multi-agent/meetings/:id/end` - 结束会议
- `POST /api/v1/multi-agent/meetings/:id/messages` - 添加会议消息
- `GET /api/v1/multi-agent/meetings/:id/messages` - 获取会议消息
- `GET /api/v1/multi-agent/meetings/:id/minutes` - 获取会议纪要

#### 审批
- `POST /api/v1/approvals` - 创建审批请求
- `GET /api/v1/approvals` - 获取审批请求列表
- `GET /api/v1/approvals/:id` - 获取审批请求详情
- `POST /api/v1/approvals/:id/decision` - 处理审批决策

#### 治理
- `GET /api/v1/governance/kpi` - 获取KPI指标
- `GET /api/v1/governance/audit-logs` - 获取审计日志
- `GET /api/v1/governance/trends` - 获取趋势分析

---

### 附录B: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 查看 [Phase 5: 管理后台完善 - 管理后台迭代计划](../phase-5-admin/admin-web.md)

