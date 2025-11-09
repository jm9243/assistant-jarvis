# Phase 5: 管理后台完善 - 管理后台迭代计划

**阶段目标**: 完善管理后台界面和运营能力  
**预计时间**: 2个月  
**依赖**: Phase 1-4 完成

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

#### 1. 认证与授权 (对应PRD 6.1)
- [ ] 登录页面
- [ ] JWT Token管理
- [ ] 权限管理
- [ ] 角色管理（超级管理员、运营、客服）

#### 2. 用户管理 (对应PRD 6.2)
- [ ] 用户列表
- [ ] 用户详情
- [ ] 用户搜索与筛选
- [ ] 用户状态管理（激活/禁用/锁定）
- [ ] 用户信息编辑
- [ ] 账户余额管理
- [ ] 使用配额管理

#### 3. 工作流管理 (对应PRD 6.3)
- [ ] 工作流列表（全局视图）
- [ ] 工作流详情查看
- [ ] 工作流搜索与筛选
- [ ] 工作流审核（上架/下架）
- [ ] 工作流分类管理
- [ ] 工作流标签管理

#### 4. Agent管理 (对应PRD 6.4)
- [ ] Agent列表（全局视图）
- [ ] Agent详情查看
- [ ] Agent搜索与筛选
- [ ] Agent审核
- [ ] Agent性能监控

#### 5. 知识库管理 (对应PRD 6.5)
- [ ] 知识库列表（全局视图）
- [ ] 知识库详情查看
- [ ] 知识库审核
- [ ] 知识库内容管理
- [ ] 知识库统计

#### 6. 工具商店管理 (对应PRD 6.6)
- [ ] 工具列表
- [ ] 工具审核
- [ ] 工具分类管理
- [ ] 工具版本管理
- [ ] 工具上架/下架

#### 7. 运营数据看板 (对应PRD 6.7)
- [ ] 核心指标展示（用户数、活跃度、工作流数、执行次数）
- [ ] 实时数据流
- [ ] 趋势图表
- [ ] 数据导出

#### 8. 系统监控 (对应PRD 6.8)
- [ ] 服务健康状态
- [ ] API性能监控
- [ ] 错误日志
- [ ] 告警管理

#### 9. 财务管理 (对应PRD 6.9)
- [ ] 订单列表
- [ ] 收入统计
- [ ] 退款管理
- [ ] 发票管理

#### 10. 内容审核 (对应PRD 6.10)
- [ ] 审核队列
- [ ] 批量审核
- [ ] 审核历史
- [ ] 审核规则配置

#### 11. 消息通知 (对应PRD 6.11)
- [ ] 消息发送（站内信、邮件、短信）
- [ ] 消息模板管理
- [ ] 消息发送历史

#### 12. 系统配置 (对应PRD 6.12)
- [ ] 全局配置管理
- [ ] 功能开关
- [ ] 参数配置
- [ ] 配置历史

---

## 核心功能详解

### 1. 认证与授权

#### 1.1 登录页面

**UI设计**:
```typescript
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/v1/admin/auth/login', {
        email,
        password
      });
      
      // 存储Token
      localStorage.setItem('admin_token', response.data.token);
      
      // 跳转到Dashboard
      navigate('/dashboard');
    } catch (error) {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <Card className="login-card">
        <h1>Assistant Jarvis 管理后台</h1>
        
        <Form onFinish={handleLogin}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          </Form.Item>
          
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
```

---

#### 1.2 权限管理

**角色定义**:
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',    // 超级管理员：全部权限
  OPERATOR = 'operator',          // 运营：用户管理、内容审核、运营数据
  SUPPORT = 'support'             // 客服：用户查询、消息通知
}

interface Permission {
  module: string; // 模块名
  actions: string[]; // 操作列表
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    { module: 'users', actions: ['read', 'write', 'delete'] },
    { module: 'workflows', actions: ['read', 'write', 'delete'] },
    { module: 'agents', actions: ['read', 'write', 'delete'] },
    { module: 'knowledge_base', actions: ['read', 'write', 'delete'] },
    { module: 'tools', actions: ['read', 'write', 'delete'] },
    { module: 'dashboard', actions: ['read'] },
    { module: 'monitoring', actions: ['read'] },
    { module: 'finance', actions: ['read', 'write'] },
    { module: 'review', actions: ['read', 'write'] },
    { module: 'notifications', actions: ['read', 'write'] },
    { module: 'settings', actions: ['read', 'write'] }
  ],
  [Role.OPERATOR]: [
    { module: 'users', actions: ['read', 'write'] },
    { module: 'workflows', actions: ['read', 'write'] },
    { module: 'agents', actions: ['read'] },
    { module: 'dashboard', actions: ['read'] },
    { module: 'review', actions: ['read', 'write'] },
    { module: 'notifications', actions: ['read', 'write'] }
  ],
  [Role.SUPPORT]: [
    { module: 'users', actions: ['read'] },
    { module: 'workflows', actions: ['read'] },
    { module: 'notifications', actions: ['read', 'write'] }
  ]
};
```

**权限检查HOC**:
```typescript
function withPermission(module: string, action: string) {
  return function<P>(Component: React.ComponentType<P>) {
    return (props: P) => {
      const { user } = useAuth();
      
      const hasPermission = rolePermissions[user.role]?.some(
        perm => perm.module === module && perm.actions.includes(action)
      );
      
      if (!hasPermission) {
        return <NoPermission />;
      }
      
      return <Component {...props} />;
    };
  };
}

// 使用
export default withPermission('users', 'write')(UserEditPage);
```

---

### 2. 用户管理

#### 2.1 用户列表

**页面组件**:
```typescript
function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'all',
    registerDateRange: null
  });
  
  const columns: ColumnType<User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200
    },
    {
      title: '昵称',
      dataIndex: 'display_name',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '正常' },
          disabled: { color: 'red', text: '禁用' },
          locked: { color: 'orange', text: '锁定' }
        };
        return <Badge color={statusMap[status].color} text={statusMap[status].text} />;
      }
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date: string) => moment(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '最后登录',
      dataIndex: 'last_sign_in_at',
      width: 180,
      render: (date: string) => date ? moment(date).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleViewUser(record.id)}>
            查看
          </Button>
          <Button size="small" onClick={() => handleEditUser(record.id)}>
            编辑
          </Button>
          <Dropdown menu={{ items: getActionMenuItems(record) }}>
            <Button size="small">更多</Button>
          </Dropdown>
        </Space>
      )
    }
  ];
  
  return (
    <div className="user-management-page">
      <PageHeader title="用户管理" />
      
      {/* 筛选器 */}
      <Card className="filter-card">
        <Space size="large">
          <Input.Search
            placeholder="搜索邮箱、昵称"
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          
          <Select
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
            <Select.Option value="locked">锁定</Select.Option>
          </Select>
          
          <RangePicker
            value={filters.registerDateRange}
            onChange={value => setFilters({ ...filters, registerDateRange: value })}
          />
          
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>
      
      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
```

---

#### 2.2 用户详情

**详情页组件**:
```typescript
function UserDetailPage({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  
  return (
    <div className="user-detail-page">
      <PageHeader
        title="用户详情"
        onBack={() => navigate('/users')}
      />
      
      {/* 基本信息 */}
      <Card title="基本信息">
        <Descriptions column={2}>
          <Descriptions.Item label="用户ID">{user?.id}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="昵称">{user?.display_name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge status={user?.status === 'active' ? 'success' : 'error'} text={user?.status} />
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {moment(user?.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user?.last_sign_in_at ? moment(user.last_sign_in_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      {/* 使用统计 */}
      <Card title="使用统计">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="工作流数量" value={stats?.workflow_count} />
          </Col>
          <Col span={6}>
            <Statistic title="Agent数量" value={stats?.agent_count} />
          </Col>
          <Col span={6}>
            <Statistic title="执行次数" value={stats?.execution_count} />
          </Col>
          <Col span={6}>
            <Statistic title="总耗时" value={stats?.total_duration} suffix="秒" />
          </Col>
        </Row>
      </Card>
      
      {/* 资源配额 */}
      <Card title="资源配额">
        <Descriptions column={2}>
          <Descriptions.Item label="工作流配额">
            {user?.quota?.workflows || 'unlimited'}
          </Descriptions.Item>
          <Descriptions.Item label="Agent配额">
            {user?.quota?.agents || 'unlimited'}
          </Descriptions.Item>
          <Descriptions.Item label="存储配额">
            {user?.quota?.storage ? `${user.quota.storage} GB` : 'unlimited'}
          </Descriptions.Item>
          <Descriptions.Item label="API调用配额">
            {user?.quota?.api_calls || 'unlimited'}
          </Descriptions.Item>
        </Descriptions>
        
        <Button onClick={handleEditQuota}>编辑配额</Button>
      </Card>
      
      {/* 操作日志 */}
      <Card title="最近操作">
        <Timeline>
          {user?.recent_activities?.map(activity => (
            <Timeline.Item key={activity.id}>
              <p>{activity.action}</p>
              <p className="text-gray-500">{moment(activity.timestamp).fromNow()}</p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
}
```

---

### 3. 运营数据看板

#### 3.1 核心指标展示

**Dashboard组件**:
```typescript
function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  
  return (
    <div className="dashboard-page">
      <PageHeader
        title="运营数据看板"
        extra={[
          <Select
            key="time-range"
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Select.Option value="24h">近24小时</Select.Option>
            <Select.Option value="7d">近7天</Select.Option>
            <Select.Option value="30d">近30天</Select.Option>
          </Select>,
          <Button key="export" icon={<DownloadOutlined />}>
            导出数据
          </Button>
        ]}
      />
      
      {/* 核心指标卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={kpis?.total_users}
              prefix={<UserOutlined />}
              suffix={
                <span className="text-sm">
                  {kpis?.users_growth > 0 ? '↑' : '↓'} {kpis?.users_growth}%
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={kpis?.active_users}
              prefix={<FireOutlined />}
              suffix={<span className="text-sm">活跃率 {kpis?.active_rate}%</span>}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="工作流数"
              value={kpis?.total_workflows}
              prefix={<NodeIndexOutlined />}
              suffix={
                <span className="text-sm">
                  {kpis?.workflows_growth > 0 ? '↑' : '↓'} {kpis?.workflows_growth}%
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="执行次数"
              value={kpis?.total_executions}
              prefix={<PlayCircleOutlined />}
              suffix={<span className="text-sm">今日 {kpis?.today_executions}</span>}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 趋势图表 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="用户增长趋势">
            <Line
              data={kpis?.user_growth_trend}
              xField="date"
              yField="count"
              smooth
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="工作流执行趋势">
            <Column
              data={kpis?.execution_trend}
              xField="date"
              yField="count"
              color="#1890ff"
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="工作流类型分布">
            <Pie
              data={kpis?.workflow_distribution}
              angleField="value"
              colorField="type"
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name} {percentage}'
              }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="用户活跃度热力图">
            <Heatmap
              data={kpis?.activity_heatmap}
              xField="hour"
              yField="weekday"
              colorField="count"
            />
          </Card>
        </Col>
      </Row>
      
      {/* 实时数据流 */}
      <Card title="实时动态" style={{ marginTop: 16 }}>
        <List
          dataSource={kpis?.real_time_activities}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.user_email}
                description={item.action}
              />
              <div>{moment(item.timestamp).fromNow()}</div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
```

---

### 4. 系统监控

#### 4.1 服务健康状态

**监控面板**:
```typescript
function SystemMonitoringPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  
  return (
    <div className="monitoring-page">
      <PageHeader title="系统监控" />
      
      {/* 服务状态 */}
      <Card title="服务健康状态">
        <Row gutter={16}>
          {services.map(service => (
            <Col key={service.name} span={6}>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{service.name}</span>
                    <Badge
                      status={service.status === 'healthy' ? 'success' : 'error'}
                      text={service.status}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <div>响应时间: {service.response_time}ms</div>
                    <div>正常运行: {service.uptime}</div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* API性能 */}
      <Card title="API性能监控" style={{ marginTop: 16 }}>
        <Tabs>
          <Tabs.TabPane tab="响应时间" key="response-time">
            <Line
              data={metrics?.api_response_time}
              xField="timestamp"
              yField="duration"
              seriesField="endpoint"
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="请求量" key="request-count">
            <Column
              data={metrics?.api_request_count}
              xField="timestamp"
              yField="count"
              seriesField="endpoint"
              isGroup
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="错误率" key="error-rate">
            <Line
              data={metrics?.api_error_rate}
              xField="timestamp"
              yField="rate"
              seriesField="endpoint"
              color={['#ff4d4f']}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
      
      {/* 错误日志 */}
      <Card title="最近错误" style={{ marginTop: 16 }}>
        <Table
          dataSource={metrics?.recent_errors}
          columns={[
            { title: '时间', dataIndex: 'timestamp', width: 180 },
            { title: '级别', dataIndex: 'level', width: 100 },
            { title: '服务', dataIndex: 'service', width: 150 },
            { title: '错误信息', dataIndex: 'message' },
            {
              title: '操作',
              key: 'actions',
              width: 100,
              render: (_, record) => (
                <Button size="small" onClick={() => handleViewError(record.id)}>
                  查看详情
                </Button>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
```

---

### 5. 内容审核

#### 5.1 审核队列

**审核页面**:
```typescript
function ContentReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'workflow' | 'agent' | 'tool' | 'knowledge'>('all');
  
  const handleBatchApprove = async () => {
    await api.post('/api/v1/admin/reviews/batch-approve', {
      item_ids: selectedIds
    });
    message.success('批量审核通过');
    fetchItems();
  };
  
  const handleBatchReject = async () => {
    const reason = await promptRejectReason();
    await api.post('/api/v1/admin/reviews/batch-reject', {
      item_ids: selectedIds,
      reason
    });
    message.success('批量审核拒绝');
    fetchItems();
  };
  
  return (
    <div className="review-page">
      <PageHeader
        title="内容审核"
        extra={[
          <Badge key="pending-count" count={items.length} showZero>
            <Button>待审核</Button>
          </Badge>,
          <Button
            key="batch-approve"
            type="primary"
            disabled={selectedIds.length === 0}
            onClick={handleBatchApprove}
          >
            批量通过
          </Button>,
          <Button
            key="batch-reject"
            danger
            disabled={selectedIds.length === 0}
            onClick={handleBatchReject}
          >
            批量拒绝
          </Button>
        ]}
      />
      
      {/* 筛选 */}
      <Card>
        <Radio.Group value={filter} onChange={e => setFilter(e.target.value)}>
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="workflow">工作流</Radio.Button>
          <Radio.Button value="agent">Agent</Radio.Button>
          <Radio.Button value="tool">工具</Radio.Button>
          <Radio.Button value="knowledge">知识库</Radio.Button>
        </Radio.Group>
      </Card>
      
      {/* 审核列表 */}
      <Card style={{ marginTop: 16 }}>
        <List
          dataSource={items}
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApprove(item.id)}
                >
                  通过
                </Button>,
                <Button
                  danger
                  size="small"
                  onClick={() => handleReject(item.id)}
                >
                  拒绝
                </Button>,
                <Button
                  size="small"
                  onClick={() => handleViewDetail(item.id)}
                >
                  查看详情
                </Button>
              ]}
            >
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onChange={e => handleSelectItem(item.id, e.target.checked)}
              />
              
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={getTypeColor(item.type)}>{item.type}</Tag>
                    <span>{item.title}</span>
                  </Space>
                }
                description={
                  <Space direction="vertical">
                    <span>提交者: {item.creator_email}</span>
                    <span>提交时间: {moment(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                    <span className="text-gray-500">{item.description}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
```

---

## 技术架构

### 前端技术栈

```
┌────────────────────────────────────────────────────────┐
│              管理后台 Web应用                           │
│                                                         │
│  框架: React 18 + TypeScript                           │
│  UI库: Ant Design 5                                    │
│  状态管理: Zustand                                      │
│  路由: React Router 6                                   │
│  HTTP客户端: Axios                                      │
│  图表: Ant Design Charts (基于G2)                      │
│  表单: Ant Design Form + react-hook-form              │
│  日期处理: Day.js                                       │
│  工具: Vite                                            │
└────────────────────────────────────────────────────────┘
```

---

### 目录结构

```
admin-web/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Layout/         # 布局组件
│   │   ├── PageHeader/     # 页头
│   │   ├── KPICard/        # KPI卡片
│   │   └── Charts/         # 图表组件
│   │
│   ├── pages/              # 页面组件
│   │   ├── Dashboard/      # 数据看板
│   │   ├── Users/          # 用户管理
│   │   ├── Workflows/      # 工作流管理
│   │   ├── Agents/         # Agent管理
│   │   ├── KnowledgeBase/  # 知识库管理
│   │   ├── Tools/          # 工具商店管理
│   │   ├── Monitoring/     # 系统监控
│   │   ├── Finance/        # 财务管理
│   │   ├── Review/         # 内容审核
│   │   ├── Notifications/  # 消息通知
│   │   └── Settings/       # 系统配置
│   │
│   ├── services/           # API服务
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── workflows.ts
│   │   └── ...
│   │
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── globalStore.ts
│   │
│   ├── types/              # TypeScript类型
│   ├── utils/              # 工具函数
│   ├── hooks/              # 自定义Hooks
│   ├── constants/          # 常量
│   └── App.tsx
│
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 开发计划

### 时间线（共2个月）

#### 第1个月：核心功能

**Week 1-2: 基础设施与认证**
- [ ] 项目初始化
- [ ] 登录页面
- [ ] 权限系统
- [ ] 基础布局

**Week 3-4: 用户与工作流管理**
- [ ] 用户管理页面
- [ ] 工作流管理页面
- [ ] Agent管理页面

---

#### 第2个月：运营与监控

**Week 5-6: 数据看板与监控**
- [ ] 运营数据看板
- [ ] 系统监控页面
- [ ] 财务管理页面

**Week 7-8: 审核与配置**
- [ ] 内容审核页面
- [ ] 消息通知页面
- [ ] 系统配置页面
- [ ] 测试与上线

---

### 开发任务分配建议

**前端团队（2人）**:
- 工程师A: 认证、用户管理、工作流管理、Agent管理
- 工程师B: 数据看板、系统监控、审核、配置

---

## 验收标准

### 功能性验收

#### 1. 认证与权限
- [ ] 登录功能正常
- [ ] 权限控制有效
- [ ] Token自动刷新

#### 2. 用户管理
- [ ] 用户列表正常展示
- [ ] 用户搜索筛选有效
- [ ] 用户状态管理正常

#### 3. 数据看板
- [ ] 核心指标准确
- [ ] 图表展示正常
- [ ] 实时数据更新

#### 4. 系统监控
- [ ] 服务状态准确
- [ ] 性能指标正确
- [ ] 错误日志完整

---

### 性能验收

- [ ] 首屏加载 < 2秒
- [ ] 页面切换流畅
- [ ] 图表渲染 < 500ms

---

### 兼容性验收

- [ ] Chrome最新版
- [ ] Edge最新版
- [ ] Safari最新版
- [ ] Firefox最新版

---

## 交付物清单

### 代码交付物
- [ ] 管理后台源代码
- [ ] UI组件库
- [ ] 单元测试代码

### 文档交付物
- [ ] 管理后台使用手册
- [ ] 开发文档
- [ ] 部署文档

---

## 附录

### 附录A: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 查看 [Phase 5: 管理后台完善 - 后台服务迭代计划](./backend-service.md)

