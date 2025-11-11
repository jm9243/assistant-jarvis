# Phase 5: 管理后台完善 - 后台服务迭代计划

**阶段目标**: 为管理后台提供完整的API支持  
**预计时间**: 2个月  
**依赖**: Phase 1-4 后台服务完成

**架构说明**: 
- 本阶段扩展Go后台API，提供管理后台所需的管理功能
- 使用Supabase存储管理员账户和审计日志
- 管理后台为纯Web应用，不涉及PC端Python引擎

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

#### 1. 管理员认证API (对应PRD 6.1)
- [ ] 管理员登录
- [ ] Token刷新
- [ ] 权限验证中间件
- [ ] 角色管理API

#### 2. 用户管理API (对应PRD 6.2)
- [ ] 用户列表查询
- [ ] 用户详情查询
- [ ] 用户搜索
- [ ] 用户状态管理
- [ ] 用户配额管理
- [ ] 用户统计

#### 3. 工作流管理API (对应PRD 6.3)
- [ ] 全局工作流列表
- [ ] 工作流审核API
- [ ] 工作流分类管理
- [ ] 工作流统计

#### 4. Agent管理API (对应PRD 6.4)
- [ ] 全局Agent列表
- [ ] Agent审核API
- [ ] Agent性能监控

#### 5. 知识库管理API (对应PRD 6.5)
- [ ] 全局知识库列表
- [ ] 知识库审核API
- [ ] 知识库统计

#### 6. 工具商店管理API (对应PRD 6.6)
- [ ] 工具审核API
- [ ] 工具分类管理
- [ ] 工具版本管理

#### 7. 运营数据API (对应PRD 6.7)
- [ ] KPI指标API
- [ ] 趋势分析API
- [ ] 实时数据流API
- [ ] 数据导出API

#### 8. 系统监控API (对应PRD 6.8)
- [ ] 服务健康检查
- [ ] 性能指标API
- [ ] 错误日志API
- [ ] 告警API

#### 9. 内容审核API (对应PRD 6.10)
- [ ] 审核队列API
- [ ] 批量审核API
- [ ] 审核历史API

#### 10. 消息通知API (对应PRD 6.11)
- [ ] 消息发送API
- [ ] 消息模板管理
- [ ] 消息历史查询

---

## 核心功能详解

### 1. 管理员认证API

#### 1.1 管理员表Schema

```sql
-- 管理员表
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  display_name TEXT,
  
  -- 角色
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'operator', 'support')) DEFAULT 'support',
  
  -- 状态
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  
  -- 登录信息
  last_sign_in_at TIMESTAMPTZ,
  last_sign_in_ip TEXT,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- 索引
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_status ON admin_users(status);

-- 管理员会话表
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
```

---

#### 1.2 管理员登录Handler

```go
// handlers/admin_auth.go
package handlers

import (
  "net/http"
  "time"
  "github.com/gin-gonic/gin"
  "github.com/golang-jwt/jwt/v5"
  "golang.org/x/crypto/bcrypt"
)

type AdminLoginRequest struct {
  Email    string `json:"email" binding:"required,email"`
  Password string `json:"password" binding:"required"`
}

type AdminLoginResponse struct {
  Token        string    `json:"token"`
  RefreshToken string    `json:"refresh_token"`
  ExpiresAt    time.Time `json:"expires_at"`
  AdminUser    AdminUser `json:"admin_user"`
}

type AdminUser struct {
  ID          string `json:"id"`
  Email       string `json:"email"`
  DisplayName string `json:"display_name"`
  Role        string `json:"role"`
}

func AdminLogin(c *gin.Context) {
  var req AdminLoginRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  // 查询管理员
  var admin struct {
    ID           string `db:"id"`
    Email        string `db:"email"`
    PasswordHash string `db:"password_hash"`
    DisplayName  string `db:"display_name"`
    Role         string `db:"role"`
    Status       string `db:"status"`
  }
  
  err := db.From("admin_users").
    Select("id, email, password_hash, display_name, role, status").
    Eq("email", req.Email).
    Single().
    ExecuteSingle(&admin)
  
  if err != nil {
    c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
    return
  }
  
  // 检查状态
  if admin.Status != "active" {
    c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
    return
  }
  
  // 验证密码
  if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
    c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
    return
  }
  
  // 生成Token
  token, refreshToken, expiresAt, err := generateAdminTokens(admin.ID, admin.Role)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
    return
  }
  
  // 保存会话
  session := map[string]interface{}{
    "admin_user_id":       admin.ID,
    "token":               token,
    "refresh_token":       refreshToken,
    "expires_at":          expiresAt,
    "refresh_expires_at":  expiresAt.Add(7 * 24 * time.Hour),
    "ip_address":          c.ClientIP(),
    "user_agent":          c.Request.UserAgent(),
  }
  
  _, err = db.From("admin_sessions").Insert(session).Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
    return
  }
  
  // 更新最后登录时间
  db.From("admin_users").
    Update(map[string]interface{}{
      "last_sign_in_at": time.Now(),
      "last_sign_in_ip": c.ClientIP(),
    }).
    Eq("id", admin.ID).
    Execute()
  
  c.JSON(http.StatusOK, AdminLoginResponse{
    Token:        token,
    RefreshToken: refreshToken,
    ExpiresAt:    expiresAt,
    AdminUser: AdminUser{
      ID:          admin.ID,
      Email:       admin.Email,
      DisplayName: admin.DisplayName,
      Role:        admin.Role,
    },
  })
}

func generateAdminTokens(adminID, role string) (token, refreshToken string, expiresAt time.Time, err error) {
  expiresAt = time.Now().Add(24 * time.Hour)
  
  // Access Token
  claims := jwt.MapClaims{
    "admin_id": adminID,
    "role":     role,
    "exp":      expiresAt.Unix(),
  }
  
  accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
  token, err = accessToken.SignedString([]byte(jwtSecret))
  if err != nil {
    return
  }
  
  // Refresh Token
  refreshClaims := jwt.MapClaims{
    "admin_id": adminID,
    "exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
  }
  
  refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
  refreshToken, err = refreshTokenObj.SignedString([]byte(jwtSecret))
  
  return
}
```

---

#### 1.3 权限验证中间件

```go
// middleware/admin_auth.go
package middleware

import (
  "net/http"
  "strings"
  "github.com/gin-gonic/gin"
  "github.com/golang-jwt/jwt/v5"
)

func AdminAuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    // 获取Token
    authHeader := c.GetHeader("Authorization")
    if authHeader == "" {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
      c.Abort()
      return
    }
    
    tokenString := strings.TrimPrefix(authHeader, "Bearer ")
    
    // 验证Token
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
      return []byte(jwtSecret), nil
    })
    
    if err != nil || !token.Valid {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
      c.Abort()
      return
    }
    
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
      c.Abort()
      return
    }
    
    // 检查会话是否存在
    var session struct {
      ID        string `db:"id"`
      ExpiresAt string `db:"expires_at"`
    }
    
    err = db.From("admin_sessions").
      Select("id, expires_at").
      Eq("token", tokenString).
      Single().
      ExecuteSingle(&session)
    
    if err != nil {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Session not found"})
      c.Abort()
      return
    }
    
    // 设置上下文
    c.Set("admin_id", claims["admin_id"])
    c.Set("admin_role", claims["role"])
    
    c.Next()
  }
}

// 权限检查中间件
func RequireAdminRole(roles ...string) gin.HandlerFunc {
  return func(c *gin.Context) {
    adminRole := c.GetString("admin_role")
    
    hasPermission := false
    for _, role := range roles {
      if adminRole == role {
        hasPermission = true
        break
      }
    }
    
    if !hasPermission {
      c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
      c.Abort()
      return
    }
    
    c.Next()
  }
}
```

---

### 2. 用户管理API

#### 2.1 用户列表Handler

```go
// handlers/admin_users.go
package handlers

func ListUsers(c *gin.Context) {
  // 分页参数
  page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
  pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
  
  // 筛选参数
  keyword := c.Query("keyword")
  status := c.Query("status")
  startDate := c.Query("start_date")
  endDate := c.Query("end_date")
  
  // 构建查询
  query := db.From("users").Select("*")
  
  // 关键词搜索（邮箱或昵称）
  if keyword != "" {
    query = query.Or(
      fmt.Sprintf("email.ilike.%%%s%%,display_name.ilike.%%%s%%", keyword, keyword),
    )
  }
  
  // 状态筛选
  if status != "" && status != "all" {
    query = query.Eq("status", status)
  }
  
  // 日期范围
  if startDate != "" {
    query = query.Gte("created_at", startDate)
  }
  if endDate != "" {
    query = query.Lte("created_at", endDate)
  }
  
  // 排序
  query = query.Order("created_at", &supabase.OrderOpts{Ascending: false})
  
  // 分页
  offset := (page - 1) * pageSize
  query = query.Range(offset, offset+pageSize-1)
  
  // 执行查询
  result, err := query.Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
    return
  }
  
  // 获取总数
  countQuery := db.From("users").Select("count", &supabase.SelectOpts{Count: "exact"})
  // 应用相同的筛选条件
  if keyword != "" {
    countQuery = countQuery.Or(
      fmt.Sprintf("email.ilike.%%%s%%,display_name.ilike.%%%s%%", keyword, keyword),
    )
  }
  if status != "" && status != "all" {
    countQuery = countQuery.Eq("status", status)
  }
  
  countResult, _ := countQuery.Execute()
  
  c.JSON(http.StatusOK, gin.H{
    "data": result,
    "pagination": gin.H{
      "page":      page,
      "page_size": pageSize,
      "total":     countResult.Count,
    },
  })
}

func GetUserDetail(c *gin.Context) {
  userID := c.Param("id")
  
  // 获取用户基本信息
  var user map[string]interface{}
  err := db.From("users").
    Select("*").
    Eq("id", userID).
    Single().
    ExecuteSingle(&user)
  
  if err != nil {
    c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
    return
  }
  
  // 获取用户统计
  stats := getUserStats(userID)
  
  // 获取最近活动
  activities := getRecentActivities(userID, 10)
  
  c.JSON(http.StatusOK, gin.H{
    "user":       user,
    "stats":      stats,
    "activities": activities,
  })
}

func UpdateUserStatus(c *gin.Context) {
  userID := c.Param("id")
  
  var req struct {
    Status string `json:"status" binding:"required,oneof=active disabled locked"`
    Reason string `json:"reason"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  // 更新状态
  update := map[string]interface{}{
    "status":     req.Status,
    "updated_at": time.Now(),
  }
  
  result, err := db.From("users").
    Update(update).
    Eq("id", userID).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
    return
  }
  
  // 记录操作日志
  logAdminAction(c.GetString("admin_id"), "update_user_status", userID, req.Reason)
  
  c.JSON(http.StatusOK, result)
}

func UpdateUserQuota(c *gin.Context) {
  userID := c.Param("id")
  
  var req struct {
    Workflows int64 `json:"workflows"`
    Agents    int64 `json:"agents"`
    Storage   int64 `json:"storage"` // GB
    APICalls  int64 `json:"api_calls"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  // 更新配额
  quota := map[string]interface{}{
    "workflows": req.Workflows,
    "agents":    req.Agents,
    "storage":   req.Storage,
    "api_calls": req.APICalls,
  }
  
  result, err := db.From("users").
    Update(map[string]interface{}{
      "quota":      quota,
      "updated_at": time.Now(),
    }).
    Eq("id", userID).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update quota"})
    return
  }
  
  // 记录操作日志
  logAdminAction(c.GetString("admin_id"), "update_user_quota", userID, fmt.Sprintf("%+v", req))
  
  c.JSON(http.StatusOK, result)
}

// 辅助函数
func getUserStats(userID string) map[string]interface{} {
  stats := make(map[string]interface{})
  
  // 工作流数量
  workflowCount, _ := db.From("workflows").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Execute()
  stats["workflow_count"] = workflowCount.Count
  
  // Agent数量
  agentCount, _ := db.From("agents").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Execute()
  stats["agent_count"] = agentCount.Count
  
  // 执行次数
  executionCount, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Eq("user_id", userID).
    Execute()
  stats["execution_count"] = executionCount.Count
  
  return stats
}

func getRecentActivities(userID string, limit int) []map[string]interface{} {
  // 从日志表获取最近活动
  result, _ := db.From("logs").
    Select("*").
    Eq("user_id", userID).
    Order("created_at", &supabase.OrderOpts{Ascending: false}).
    Limit(limit).
    Execute()
  
  return result.Data
}
```

---

### 3. 运营数据API

#### 3.1 KPI指标Handler

```go
// handlers/admin_dashboard.go
package handlers

type DashboardKPIs struct {
  // 用户指标
  TotalUsers     int64   `json:"total_users"`
  ActiveUsers    int64   `json:"active_users"`
  UsersGrowth    float64 `json:"users_growth"`
  ActiveRate     float64 `json:"active_rate"`
  
  // 工作流指标
  TotalWorkflows   int64   `json:"total_workflows"`
  WorkflowsGrowth  float64 `json:"workflows_growth"`
  
  // 执行指标
  TotalExecutions  int64 `json:"total_executions"`
  TodayExecutions  int64 `json:"today_executions"`
  
  // 趋势数据
  UserGrowthTrend    []DataPoint `json:"user_growth_trend"`
  ExecutionTrend     []DataPoint `json:"execution_trend"`
  WorkflowDistribution []PieData `json:"workflow_distribution"`
  ActivityHeatmap    []HeatmapData `json:"activity_heatmap"`
  
  // 实时数据
  RealTimeActivities []Activity `json:"real_time_activities"`
}

type DataPoint struct {
  Date  string  `json:"date"`
  Count int64   `json:"count"`
}

type PieData struct {
  Type  string  `json:"type"`
  Value int64   `json:"value"`
}

type HeatmapData struct {
  Hour    int    `json:"hour"`
  Weekday string `json:"weekday"`
  Count   int64  `json:"count"`
}

type Activity struct {
  UserEmail string `json:"user_email"`
  Action    string `json:"action"`
  Timestamp string `json:"timestamp"`
}

func GetDashboardKPIs(c *gin.Context) {
  timeRange := c.DefaultQuery("range", "7d")
  
  kpis := DashboardKPIs{}
  
  // 1. 总用户数
  totalUsers, _ := db.From("users").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Execute()
  kpis.TotalUsers = totalUsers.Count
  
  // 2. 活跃用户数（最近7天有活动）
  sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour).Format(time.RFC3339)
  activeUsers, _ := db.From("users").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Gte("last_active_at", sevenDaysAgo).
    Execute()
  kpis.ActiveUsers = activeUsers.Count
  
  // 3. 活跃率
  if kpis.TotalUsers > 0 {
    kpis.ActiveRate = float64(kpis.ActiveUsers) / float64(kpis.TotalUsers) * 100
  }
  
  // 4. 用户增长率
  kpis.UsersGrowth = calculateGrowthRate("users", timeRange)
  
  // 5. 工作流数量
  totalWorkflows, _ := db.From("workflows").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Execute()
  kpis.TotalWorkflows = totalWorkflows.Count
  
  // 6. 工作流增长率
  kpis.WorkflowsGrowth = calculateGrowthRate("workflows", timeRange)
  
  // 7. 总执行次数
  totalExecutions, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Execute()
  kpis.TotalExecutions = totalExecutions.Count
  
  // 8. 今日执行次数
  todayStart := time.Now().Truncate(24 * time.Hour).Format(time.RFC3339)
  todayExecutions, _ := db.From("tasks").
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Gte("created_at", todayStart).
    Execute()
  kpis.TodayExecutions = todayExecutions.Count
  
  // 9. 用户增长趋势
  kpis.UserGrowthTrend = getUserGrowthTrend(timeRange)
  
  // 10. 执行趋势
  kpis.ExecutionTrend = getExecutionTrend(timeRange)
  
  // 11. 工作流类型分布
  kpis.WorkflowDistribution = getWorkflowDistribution()
  
  // 12. 活跃度热力图
  kpis.ActivityHeatmap = getActivityHeatmap(timeRange)
  
  // 13. 实时活动
  kpis.RealTimeActivities = getRealTimeActivities(20)
  
  c.JSON(http.StatusOK, kpis)
}

func calculateGrowthRate(table, timeRange string) float64 {
  // 根据timeRange计算增长率
  var days int
  switch timeRange {
  case "24h":
    days = 1
  case "7d":
    days = 7
  case "30d":
    days = 30
  default:
    days = 7
  }
  
  now := time.Now()
  periodStart := now.Add(-time.Duration(days) * 24 * time.Hour)
  previousPeriodStart := periodStart.Add(-time.Duration(days) * 24 * time.Hour)
  
  // 当前周期数量
  currentCount, _ := db.From(table).
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Gte("created_at", periodStart.Format(time.RFC3339)).
    Execute()
  
  // 上一周期数量
  previousCount, _ := db.From(table).
    Select("count", &supabase.SelectOpts{Count: "exact"}).
    Gte("created_at", previousPeriodStart.Format(time.RFC3339)).
    Lt("created_at", periodStart.Format(time.RFC3339)).
    Execute()
  
  if previousCount.Count == 0 {
    return 0
  }
  
  growth := float64(currentCount.Count-previousCount.Count) / float64(previousCount.Count) * 100
  return math.Round(growth*100) / 100
}

func getUserGrowthTrend(timeRange string) []DataPoint {
  // 根据timeRange生成数据点
  // TODO: 实现具体逻辑
  return []DataPoint{}
}

func getExecutionTrend(timeRange string) []DataPoint {
  // TODO: 实现具体逻辑
  return []DataPoint{}
}

func getWorkflowDistribution() []PieData {
  // 按类型统计工作流
  // TODO: 实现具体逻辑
  return []PieData{}
}

func getActivityHeatmap(timeRange string) []HeatmapData {
  // 生成活跃度热力图数据
  // TODO: 实现具体逻辑
  return []HeatmapData{}
}

func getRealTimeActivities(limit int) []Activity {
  // 获取最近的活动记录
  result, _ := db.From("logs").
    Select("*").
    Order("created_at", &supabase.OrderOpts{Ascending: false}).
    Limit(limit).
    Execute()
  
  activities := []Activity{}
  for _, log := range result.Data {
    activities = append(activities, Activity{
      UserEmail: log["user_email"].(string),
      Action:    log["action"].(string),
      Timestamp: log["created_at"].(string),
    })
  }
  
  return activities
}
```

---

### 4. 内容审核API

#### 4.1 审核Handler

```go
// handlers/admin_review.go
package handlers

func ListReviewItems(c *gin.Context) {
  // 筛选类型
  itemType := c.Query("type") // workflow, agent, tool, knowledge
  
  query := db.From("review_queue").
    Select("*").
    Eq("status", "pending")
  
  if itemType != "" && itemType != "all" {
    query = query.Eq("item_type", itemType)
  }
  
  query = query.Order("created_at", &supabase.OrderOpts{Ascending: true})
  
  result, err := query.Execute()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch review items"})
    return
  }
  
  c.JSON(http.StatusOK, result)
}

func ApproveReviewItem(c *gin.Context) {
  itemID := c.Param("id")
  
  // 更新审核状态
  update := map[string]interface{}{
    "status":       "approved",
    "reviewed_by":  c.GetString("admin_id"),
    "reviewed_at":  time.Now(),
    "updated_at":   time.Now(),
  }
  
  result, err := db.From("review_queue").
    Update(update).
    Eq("id", itemID).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve item"})
    return
  }
  
  // 记录操作日志
  logAdminAction(c.GetString("admin_id"), "approve_review", itemID, "")
  
  c.JSON(http.StatusOK, result)
}

func RejectReviewItem(c *gin.Context) {
  itemID := c.Param("id")
  
  var req struct {
    Reason string `json:"reason" binding:"required"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  // 更新审核状态
  update := map[string]interface{}{
    "status":        "rejected",
    "reviewed_by":   c.GetString("admin_id"),
    "reviewed_at":   time.Now(),
    "reject_reason": req.Reason,
    "updated_at":    time.Now(),
  }
  
  result, err := db.From("review_queue").
    Update(update).
    Eq("id", itemID).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject item"})
    return
  }
  
  // 记录操作日志
  logAdminAction(c.GetString("admin_id"), "reject_review", itemID, req.Reason)
  
  c.JSON(http.StatusOK, result)
}

func BatchApproveReviewItems(c *gin.Context) {
  var req struct {
    ItemIDs []string `json:"item_ids" binding:"required"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  
  // 批量更新
  update := map[string]interface{}{
    "status":      "approved",
    "reviewed_by": c.GetString("admin_id"),
    "reviewed_at": time.Now(),
    "updated_at":  time.Now(),
  }
  
  result, err := db.From("review_queue").
    Update(update).
    In("id", req.ItemIDs).
    Execute()
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to batch approve"})
    return
  }
  
  // 记录操作日志
  logAdminAction(c.GetString("admin_id"), "batch_approve_review", strings.Join(req.ItemIDs, ","), "")
  
  c.JSON(http.StatusOK, result)
}
```

---

## 技术架构

### API路由结构

```go
// routes/admin.go
func SetupAdminRoutes(router *gin.Engine, db *supabase.Client) {
  admin := router.Group("/api/v1/admin")
  
  // 认证（无需Auth）
  admin.POST("/auth/login", handlers.AdminLogin)
  admin.POST("/auth/refresh", handlers.AdminRefreshToken)
  
  // 需要认证的路由
  authorized := admin.Group("/")
  authorized.Use(middleware.AdminAuthMiddleware())
  {
    // 用户管理
    users := authorized.Group("/users")
    users.Use(middleware.RequireAdminRole("super_admin", "operator"))
    {
      users.GET("", handlers.ListUsers)
      users.GET("/:id", handlers.GetUserDetail)
      users.PUT("/:id/status", handlers.UpdateUserStatus)
      users.PUT("/:id/quota", handlers.UpdateUserQuota)
    }
    
    // 工作流管理
    workflows := authorized.Group("/workflows")
    workflows.Use(middleware.RequireAdminRole("super_admin", "operator"))
    {
      workflows.GET("", handlers.ListAllWorkflows)
      workflows.GET("/:id", handlers.GetWorkflowDetail)
      workflows.POST("/:id/review", handlers.ReviewWorkflow)
    }
    
    // Agent管理
    agents := authorized.Group("/agents")
    agents.Use(middleware.RequireAdminRole("super_admin", "operator"))
    {
      agents.GET("", handlers.ListAllAgents)
      agents.GET("/:id", handlers.GetAgentDetail)
      agents.POST("/:id/review", handlers.ReviewAgent)
    }
    
    // 数据看板
    dashboard := authorized.Group("/dashboard")
    {
      dashboard.GET("/kpi", handlers.GetDashboardKPIs)
      dashboard.GET("/export", handlers.ExportData)
    }
    
    // 系统监控
    monitoring := authorized.Group("/monitoring")
    monitoring.Use(middleware.RequireAdminRole("super_admin"))
    {
      monitoring.GET("/services", handlers.GetServiceStatus)
      monitoring.GET("/metrics", handlers.GetSystemMetrics)
      monitoring.GET("/errors", handlers.GetErrorLogs)
    }
    
    // 内容审核
    review := authorized.Group("/reviews")
    review.Use(middleware.RequireAdminRole("super_admin", "operator"))
    {
      review.GET("", handlers.ListReviewItems)
      review.POST("/:id/approve", handlers.ApproveReviewItem)
      review.POST("/:id/reject", handlers.RejectReviewItem)
      review.POST("/batch-approve", handlers.BatchApproveReviewItems)
      review.POST("/batch-reject", handlers.BatchRejectReviewItems)
    }
    
    // 消息通知
    notifications := authorized.Group("/notifications")
    {
      notifications.POST("/send", handlers.SendNotification)
      notifications.GET("/templates", handlers.ListNotificationTemplates)
      notifications.POST("/templates", handlers.CreateNotificationTemplate)
    }
  }
}
```

---

## 开发计划

### 时间线（共2个月）

#### 第1个月：核心API

**Week 1-2: 认证与用户管理**
- [ ] 管理员认证API
- [ ] 权限中间件
- [ ] 用户管理API

**Week 3-4: 资源管理API**
- [ ] 工作流管理API
- [ ] Agent管理API
- [ ] 知识库管理API
- [ ] 工具管理API

---

#### 第2个月：运营与监控

**Week 5-6: 数据与监控**
- [ ] 运营数据API
- [ ] 系统监控API

**Week 7-8: 审核与通知**
- [ ] 内容审核API
- [ ] 消息通知API
- [ ] 测试与上线

---

## 验收标准

### 功能性验收

- [ ] 所有API正常工作
- [ ] 权限控制有效
- [ ] 数据统计准确

### 性能验收

- [ ] API响应时间 < 200ms (P95)
- [ ] 并发支持 > 100 QPS

### 安全验收

- [ ] Token验证有效
- [ ] 权限隔离完善
- [ ] 操作日志完整

---

## 交付物清单

- [ ] Go后端源代码（管理后台API）
- [ ] API文档
- [ ] 测试代码
- [ ] 部署文档

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 查看 [Phase 6: 手机端迭代计划](../phase-6-mobile/)

