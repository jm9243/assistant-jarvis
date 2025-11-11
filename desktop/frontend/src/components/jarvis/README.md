# 贾维斯 AI 助理组件

全局 AI 助理"贾维斯"的前端实现，提供 Spotlight 风格的快速任务执行界面。

## 功能特性

### 1. 全局搜索框 (JarvisSearchBox)
- **快捷键唤出**: `Cmd/Ctrl + Space`
- **Spotlight 风格**: 悬浮窗设计，支持背景模糊
- **示例任务**: 提供常用任务示例
- **实时反馈**: 显示处理状态

### 2. 执行计划确认 (ExecutionPlanDialog)
- **意图识别**: 显示识别的用户意图
- **步骤展示**: 列出详细的执行步骤
- **风险提示**: 对敏感操作显示警告
- **预估时间**: 显示任务预计耗时

### 3. 实时进度反馈 (ExecutionProgress)
- **进度条**: 可视化显示执行进度
- **步骤状态**: 实时更新每个步骤的状态
- **中间结果**: 显示步骤执行结果
- **错误处理**: 显示执行错误信息
- **取消功能**: 支持中途取消执行

## 组件结构

```
jarvis/
├── JarvisContainer.tsx       # 主容器组件，整合所有子组件
├── JarvisSearchBox.tsx       # 搜索框组件
├── ExecutionPlanDialog.tsx   # 执行计划确认对话框
├── ExecutionProgress.tsx     # 执行进度反馈组件
├── useJarvis.ts             # 自定义 Hook（可选）
├── index.ts                 # 导出文件
└── README.md                # 本文档
```

## 使用方法

### 1. 在 App.tsx 中集成

```tsx
import { JarvisContainer } from '@/components/jarvis';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <JarvisContainer />
    </>
  );
}
```

### 2. 使用 Zustand Store

```tsx
import { useJarvisStore } from '@/stores/jarvisStore';

function MyComponent() {
  const { open, isOpen, processQuery } = useJarvisStore();

  const handleOpenJarvis = () => {
    open();
  };

  return (
    <button onClick={handleOpenJarvis}>
      打开贾维斯
    </button>
  );
}
```

## 状态管理

使用 Zustand 管理全局状态：

```typescript
interface JarvisState {
  isOpen: boolean;              // 是否打开
  isProcessing: boolean;        // 是否正在处理
  currentPlan: ExecutionPlan | null;  // 当前执行计划
  executionHistory: ExecutionPlan[];  // 执行历史
  error: string | null;         // 错误信息
}
```

## API 集成

### 处理查询
```typescript
// POST /api/v1/jarvis/process
{
  "query": "帮我创建一个新的工作流",
  "context": {}
}

// Response
{
  "plan_id": "xxx",
  "intent": "创建工作流",
  "steps": [...],
  "requires_approval": true,
  "estimated_time": 30
}
```

### 执行计划
```typescript
// POST /api/v1/jarvis/execute
{
  "plan_id": "xxx",
  "approved": true
}
```

## 快捷键

- `Cmd/Ctrl + Space`: 打开/关闭贾维斯搜索框
- `Enter`: 提交查询或确认执行
- `Esc`: 关闭搜索框或取消操作

## 样式定制

组件使用 Tailwind CSS，支持深色模式：

```tsx
// 主题色
- 紫色: purple-500, purple-600 (主要操作)
- 绿色: green-500 (成功状态)
- 红色: red-500 (错误状态)
- 琥珀色: amber-500 (警告信息)
```

## 注意事项

1. **API 降级**: 如果后端 API 不可用，会使用模拟数据
2. **权限控制**: 敏感操作需要用户确认
3. **错误处理**: 所有错误都会友好提示
4. **性能优化**: 使用防抖和节流优化输入体验

## 未来扩展

- [ ] 支持语音输入
- [ ] 支持多轮对话
- [ ] 支持任务历史记录
- [ ] 支持自定义快捷键
- [ ] 支持插件系统
