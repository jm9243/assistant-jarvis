# Phase 6: 手机端 - 移动端迭代计划（未来计划）

**阶段目标**: 提供移动端监控管理能力  
**预计时间**: 3个月  
**依赖**: Phase 1-5 完成  
**状态**: 📋 未来计划

**架构说明**: 
- 移动端为纯监控和管理应用，不执行自动化任务
- 通过Go后台API与PC端通信（WebSocket实时推送）
- 所有自动化任务在PC端Python引擎中执行

---

## ⚠️ 重要说明

本阶段为**未来计划**，将在Phase 1-5完成并稳定运行后启动。本文档仅作为前期规划参考，实际开发时需要根据：
1. PC端和管理后台的用户反馈
2. 移动端使用场景的验证
3. 技术栈的最新发展
4. 资源和时间的实际情况

进行重新评估和调整。

---

## 目录

1. [产品定位](#产品定位)
2. [功能清单](#功能清单)
3. [核心功能详解](#核心功能详解)
4. [技术架构](#技术架构)
5. [开发计划](#开发计划)
6. [验收标准](#验收标准)

---

## 产品定位

### 核心价值

手机端**不是**PC端的完整复刻，而是作为**移动助手和监控中心**：

1. **监控中心**: 实时监控工作流执行状态、Agent运行情况
2. **移动控制台**: 快速启停任务、应急处理异常
3. **轻量交互**: 与Agent进行简单对话、查看执行结果
4. **通知中心**: 及时接收重要通知和告警

### 不做什么

- ❌ 不做复杂的工作流设计（设计工作仍在PC端完成）
- ❌ 不做Agent配置和训练（配置工作仍在PC端完成）
- ❌ 不做知识库的大规模内容编辑（编辑工作仍在PC端完成）
- ❌ 不做系统级的深度设置（设置工作仍在PC端完成）

---

## 功能清单

### 必须完成的功能模块

#### 1. 认证与账户 (对应PRD 5.1)
- [ ] 登录/注册
- [ ] 生物识别认证（Face ID/Touch ID）
- [ ] 账户信息查看
- [ ] 基础设置

#### 2. 首页Dashboard (对应PRD 5.2)
- [ ] 核心KPI卡片（今日执行、成功率、运行中任务）
- [ ] 快捷操作（启动常用工作流、查看最近任务）
- [ ] 实时状态流
- [ ] 告警通知

#### 3. 工作流监控 (对应PRD 5.3)
- [ ] 工作流列表（已启用/已停用）
- [ ] 工作流详情查看
- [ ] 工作流启停控制
- [ ] 执行历史查看
- [ ] 快速重试

#### 4. 任务管理 (对应PRD 5.4)
- [ ] 任务列表（运行中/已完成/失败）
- [ ] 任务详情查看
- [ ] 任务日志查看
- [ ] 任务操作（停止、重试、删除）

#### 5. Agent对话 (对应PRD 5.5)
- [ ] Agent列表
- [ ] 对话界面
- [ ] 语音输入
- [ ] 会话历史

#### 6. 通知中心 (对应PRD 5.6)
- [ ] 通知列表
- [ ] 通知详情
- [ ] 通知设置（哪些事件推送）
- [ ] 推送权限管理

#### 7. 设置 (对应PRD 5.7)
- [ ] 账户信息
- [ ] 通知设置
- [ ] 安全设置
- [ ] 关于

---

## 核心功能详解

### 1. 首页Dashboard

#### 1.1 页面布局

**UI组件（React Native + TypeScript）**:
```typescript
// src/screens/Home/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';

interface DashboardData {
  kpis: {
    todayExecutions: number;
    successRate: number;
    runningTasks: number;
    failedTasks: number;
  };
  recentActivities: Activity[];
  alerts: Alert[];
}

export function HomeScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchDashboard = async () => {
    const response = await api.get('/api/v1/mobile/dashboard');
    setData(response.data);
  };
  
  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* KPI卡片 */}
      <View style={styles.kpiSection}>
        <KPICard
          title="今日执行"
          value={data?.kpis.todayExecutions}
          icon="play-circle"
          color="#1890ff"
        />
        <KPICard
          title="成功率"
          value={`${data?.kpis.successRate}%`}
          icon="check-circle"
          color="#52c41a"
        />
        <KPICard
          title="运行中"
          value={data?.kpis.runningTasks}
          icon="loading"
          color="#faad14"
        />
        <KPICard
          title="失败"
          value={data?.kpis.failedTasks}
          icon="close-circle"
          color="#f5222d"
        />
      </View>
      
      {/* 快捷操作 */}
      <QuickActionsSection />
      
      {/* 告警通知 */}
      {data?.alerts && data.alerts.length > 0 && (
        <AlertsSection alerts={data.alerts} />
      )}
      
      {/* 实时活动流 */}
      <ActivityStreamSection activities={data?.recentActivities} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  kpiSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  }
});
```

---

#### 1.2 快捷操作组件

```typescript
// src/components/QuickActions/QuickActionsSection.tsx
function QuickActionsSection() {
  const [favoriteWorkflows, setFavoriteWorkflows] = useState<Workflow[]>([]);
  
  return (
    <View style={styles.section}>
      <SectionHeader title="快捷操作" />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* 启动常用工作流 */}
        {favoriteWorkflows.map(workflow => (
          <QuickActionCard
            key={workflow.id}
            title={workflow.name}
            icon={workflow.icon}
            onPress={() => handleStartWorkflow(workflow.id)}
          />
        ))}
        
        {/* 查看最近任务 */}
        <QuickActionCard
          title="最近任务"
          icon="history"
          onPress={() => navigate('Tasks')}
        />
        
        {/* 与Agent对话 */}
        <QuickActionCard
          title="AI助理"
          icon="message"
          onPress={() => navigate('Chat')}
        />
      </ScrollView>
    </View>
  );
}
```

---

### 2. 工作流监控

#### 2.1 工作流列表

```typescript
// src/screens/Workflows/WorkflowsScreen.tsx
function WorkflowsScreen() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  return (
    <View style={styles.container}>
      {/* 筛选器 */}
      <View style={styles.filterBar}>
        <FilterChip
          label="全部"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterChip
          label="已启用"
          selected={filter === 'enabled'}
          onPress={() => setFilter('enabled')}
        />
        <FilterChip
          label="已停用"
          selected={filter === 'disabled'}
          onPress={() => setFilter('disabled')}
        />
      </View>
      
      {/* 工作流列表 */}
      <FlatList
        data={workflows}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WorkflowCard
            workflow={item}
            onPress={() => navigate('WorkflowDetail', { id: item.id })}
            onToggle={() => handleToggleWorkflow(item.id, item.enabled)}
          />
        )}
      />
    </View>
  );
}

// 工作流卡片组件
function WorkflowCard({ workflow, onPress, onToggle }: WorkflowCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Icon name={workflow.icon} size={24} />
          <Text style={styles.title}>{workflow.name}</Text>
        </View>
        
        <Switch
          value={workflow.enabled}
          onValueChange={onToggle}
          trackColor={{ true: '#1890ff', false: '#d9d9d9' }}
        />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.description} numberOfLines={2}>
          {workflow.description}
        </Text>
        
        <View style={styles.stats}>
          <Stat label="今日执行" value={workflow.todayCount} />
          <Stat label="成功率" value={`${workflow.successRate}%`} />
          <Stat label="平均耗时" value={`${workflow.avgDuration}s`} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

---

#### 2.2 工作流详情

```typescript
// src/screens/Workflows/WorkflowDetailScreen.tsx
function WorkflowDetailScreen({ route }) {
  const { id } = route.params;
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  
  return (
    <ScrollView style={styles.container}>
      {/* 工作流信息 */}
      <Card style={styles.infoCard}>
        <View style={styles.header}>
          <Icon name={workflow?.icon} size={32} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{workflow?.name}</Text>
            <Badge status={workflow?.enabled ? 'success' : 'default'}>
              {workflow?.enabled ? '已启用' : '已停用'}
            </Badge>
          </View>
        </View>
        
        <Text style={styles.description}>{workflow?.description}</Text>
        
        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            type="primary"
            onPress={() => handleStartWorkflow(id)}
            disabled={!workflow?.enabled}
          >
            立即执行
          </Button>
          <Button onPress={() => handleToggleWorkflow(id, workflow?.enabled)}>
            {workflow?.enabled ? '停用' : '启用'}
          </Button>
        </View>
      </Card>
      
      {/* 统计数据 */}
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>执行统计</Text>
        <View style={styles.statsGrid}>
          <StatCard label="总执行次数" value={workflow?.totalCount} />
          <StatCard label="成功次数" value={workflow?.successCount} />
          <StatCard label="失败次数" value={workflow?.failCount} />
          <StatCard label="成功率" value={`${workflow?.successRate}%`} />
        </View>
      </Card>
      
      {/* 执行历史 */}
      <Card style={styles.historyCard}>
        <Text style={styles.sectionTitle}>执行历史</Text>
        <FlatList
          data={executions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExecutionItem
              execution={item}
              onPress={() => navigate('TaskDetail', { id: item.id })}
            />
          )}
        />
      </Card>
    </ScrollView>
  );
}
```

---

### 3. 任务管理

#### 3.1 任务列表

```typescript
// src/screens/Tasks/TasksScreen.tsx
function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  
  return (
    <View style={styles.container}>
      {/* 筛选器 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        <FilterChip label="全部" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="运行中" selected={filter === 'running'} onPress={() => setFilter('running')} />
        <FilterChip label="已完成" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
        <FilterChip label="失败" selected={filter === 'failed'} onPress={() => setFilter('failed')} />
      </ScrollView>
      
      {/* 任务列表 */}
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => navigate('TaskDetail', { id: item.id })}
          />
        )}
      />
    </View>
  );
}

function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.workflowName}>{task.workflowName}</Text>
        <StatusBadge status={task.status} />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.taskId}>#{task.id.slice(0, 8)}</Text>
        <Text style={styles.timestamp}>
          {moment(task.createdAt).fromNow()}
        </Text>
      </View>
      
      {task.status === 'running' && (
        <ProgressBar progress={task.progress} />
      )}
      
      {task.status === 'failed' && (
        <Text style={styles.errorText} numberOfLines={1}>
          {task.error}
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

---

### 4. Agent对话

#### 4.1 对话界面

```typescript
// src/screens/Chat/ChatScreen.tsx
function ChatScreen({ route }) {
  const { agentId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: uuid(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/v1/agents/chat', {
        agent_id: agentId,
        message: input
      });
      
      const assistantMessage: Message = {
        id: uuid(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // 处理错误
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoiceInput = async () => {
    // TODO: 实现语音输入
  };
  
  return (
    <View style={styles.container}>
      {/* 消息列表 */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
        inverted
      />
      
      {/* 输入框 */}
      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleVoiceInput}>
          <Icon name="mic" size={24} color="#1890ff" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="输入消息..."
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Icon
            name="send"
            size={24}
            color={input.trim() && !loading ? '#1890ff' : '#d9d9d9'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.assistantBubble
    ]}>
      <Text style={[
        styles.messageText,
        isUser ? styles.userText : styles.assistantText
      ]}>
        {message.content}
      </Text>
      <Text style={styles.timestamp}>
        {moment(message.timestamp).format('HH:mm')}
      </Text>
    </View>
  );
}
```

---

### 5. 通知中心

#### 5.1 通知列表

```typescript
// src/screens/Notifications/NotificationsScreen.tsx
function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
      />
    </View>
  );
}

function NotificationCard({ notification, onPress }: NotificationCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !notification.read && styles.unreadCard
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Icon
          name={getNotificationIcon(notification.type)}
          size={24}
          color={getNotificationColor(notification.type)}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>
          {moment(notification.createdAt).fromNow()}
        </Text>
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}
```

---

## 技术架构

### 技术栈选择

```
┌─────────────────────────────────────────────────────────┐
│                   移动端应用                             │
│                                                          │
│  框架: React Native (支持iOS和Android)                  │
│  语言: TypeScript                                        │
│  UI库: React Native Paper / NativeBase                  │
│  导航: React Navigation 6                                │
│  状态管理: Zustand                                       │
│  HTTP客户端: Axios                                       │
│  WebSocket: socket.io-client                            │
│  本地存储: AsyncStorage                                  │
│  安全存储: react-native-keychain                         │
│  生物识别: react-native-biometrics                       │
│  推送通知: @react-native-firebase/messaging (FCM)       │
│  语音识别: @react-native-voice/voice                    │
│  图表: react-native-chart-kit                           │
│  构建工具: Metro                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 目录结构

```
mobile/
├── src/
│   ├── screens/           # 页面组件
│   │   ├── Auth/          # 认证
│   │   ├── Home/          # 首页
│   │   ├── Workflows/     # 工作流
│   │   ├── Tasks/         # 任务
│   │   ├── Chat/          # Agent对话
│   │   ├── Notifications/ # 通知
│   │   └── Settings/      # 设置
│   │
│   ├── components/        # 通用组件
│   │   ├── KPICard/
│   │   ├── WorkflowCard/
│   │   ├── TaskCard/
│   │   └── ...
│   │
│   ├── navigation/        # 导航配置
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── MainStack.tsx
│   │
│   ├── services/          # API服务
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── workflows.ts
│   │   └── ...
│   │
│   ├── stores/            # Zustand stores
│   │   ├── authStore.ts
│   │   └── globalStore.ts
│   │
│   ├── types/             # TypeScript类型
│   ├── utils/             # 工具函数
│   ├── hooks/             # 自定义Hooks
│   ├── constants/         # 常量
│   └── App.tsx
│
├── ios/                   # iOS原生代码
├── android/               # Android原生代码
├── package.json
└── tsconfig.json
```

---

## 开发计划

### 时间线（共3个月）

#### 第1个月：基础功能

**Week 1-2: 项目初始化与认证**
- [ ] React Native项目初始化
- [ ] 导航结构搭建
- [ ] 登录/注册页面
- [ ] 生物识别集成

**Week 3-4: 首页与工作流监控**
- [ ] Dashboard页面
- [ ] 工作流列表
- [ ] 工作流详情
- [ ] 工作流控制

---

#### 第2个月：任务与Agent

**Week 5-6: 任务管理**
- [ ] 任务列表
- [ ] 任务详情
- [ ] 任务日志查看

**Week 7-8: Agent对话**
- [ ] Agent列表
- [ ] 对话界面
- [ ] 语音输入集成

---

#### 第3个月：通知与优化

**Week 9-10: 通知与设置**
- [ ] 通知中心
- [ ] 推送通知集成
- [ ] 设置页面

**Week 11-12: 测试与上线**
- [ ] 功能测试
- [ ] 性能优化
- [ ] 应用商店上架准备

---

### 开发任务分配建议

**移动端团队（2人）**:
- 工程师A: 认证、首页、工作流、任务
- 工程师B: Agent对话、通知、设置、原生模块

---

## 验收标准

### 功能性验收

- [ ] 所有核心功能正常工作
- [ ] iOS和Android双平台适配
- [ ] 推送通知正常

### 性能验收

- [ ] 应用启动时间 < 3秒
- [ ] 页面切换流畅（60 FPS）
- [ ] 内存使用合理（< 200MB）

### 兼容性验收

**iOS**:
- [ ] iOS 14+
- [ ] iPhone SE / 12 / 13 / 14 系列

**Android**:
- [ ] Android 10+
- [ ] 主流机型适配

---

## 交付物清单

### 代码交付物
- [ ] React Native源代码
- [ ] iOS原生模块
- [ ] Android原生模块

### 应用交付物
- [ ] iOS .ipa包
- [ ] Android .apk/.aab包
- [ ] App Store / Google Play商店素材

### 文档交付物
- [ ] 移动端用户手册
- [ ] 开发文档
- [ ] 上架指南

---

## 附录

### 附录A: 与PC端功能对比

| 功能模块 | PC端 | 移动端 | 说明 |
|---------|------|--------|------|
| 工作流设计 | ✅ 完整支持 | ❌ 不支持 | 设计工作在PC端完成 |
| 工作流监控 | ✅ 完整支持 | ✅ 精简版 | 移动端提供监控和控制 |
| Agent配置 | ✅ 完整支持 | ❌ 不支持 | 配置工作在PC端完成 |
| Agent对话 | ✅ 完整支持 | ✅ 完整支持 | 移动端支持对话和语音 |
| 知识库编辑 | ✅ 完整支持 | ❌ 不支持 | 编辑工作在PC端完成 |
| 知识库查看 | ✅ 完整支持 | ✅ 仅查看 | 移动端只能查看 |
| 通知中心 | ✅ 支持 | ✅ 完整支持 | 移动端加强推送 |

---

### 附录B: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本（未来计划） | 产品团队 |

---

**文档状态**: 📋 未来计划  
**最后更新**: 2025-11-08

**说明**: 本文档为前期规划，实际开发前需根据Phase 1-5的反馈进行调整。

