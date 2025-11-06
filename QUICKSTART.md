# 快速开始指南

## 5分钟快速上手

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

这将同时启动：
- React 开发服务器 (http://localhost:3000)
- Electron 应用窗口

### 3. 浏览应用

应用启动后，您可以：
- 点击 **"Start Recording"** 开始录制
- 访问 **"Workflow Editor"** 创建工作流
- 查看 **"Task Center"** 查看执行历史

## 主要功能快速导览

### 📹 录制 (Recorder)
```typescript
// 开始录制用户操作
const session = recorder.startRecording();
// 系统自动捕获点击、输入等操作
const finalSession = recorder.stopRecording();
```

### 🔄 工作流编辑 (Workflow Editor)
```typescript
// 创建工作流
const builder = new WorkflowBuilder('workflow_1', 'My Workflow');
builder
  .addNode(/* 操作节点 */)
  .addNode(/* 条件节点 */)
  .addEdge(/* 连接节点 */);
const workflow = builder.build();
```

### ▶️ 执行工作流 (Runtime)
```typescript
// 执行工作流
const engine = new RuntimeEngine();
const execution = await engine.executeWorkflow(
  workflow.id,
  { variableName: 'value' }
);
```

### 🎯 调试 (Debugger)
```typescript
// 设置断点
debugger.addBreakpoint('nodeId');

// 单步执行
debugger.pause();
debugger.resume();
```

### 🤖 智能体节点 (Agent)
```typescript
// AI驱动的决策
const agent = new AgentNode(nodeConfig, agentConfig);
const decision = await agent.makeDecision(context);
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境 |
| `npm run build` | 构建应用 |
| `npm run dist` | 打包成可安装的应用 |
| `npm run dist:mac` | 仅构建 macOS 版本 |
| `npm run dist:win` | 仅构建 Windows 版本 |
| `npm run type-check` | 检查类型错误 |
| `npm run lint` | 运行 ESLint |

## 项目文件导览

### 核心文件
- `src/App.tsx` - 主应用组件，定义路由
- `src/main/index.ts` - Electron 主进程
- `src/store/index.ts` - 全局状态管理

### 页面
- `src/pages/Dashboard.tsx` - 首页/仪表板
- `src/pages/RecorderPage.tsx` - 录制页面
- `src/pages/WorkflowEditor.tsx` - 工作流编辑器
- `src/pages/ElementManager.tsx` - 元素管理
- `src/pages/TaskCenter.tsx` - 任务中心
- `src/pages/TemplateCenter.tsx` - 模板库
- `src/pages/AgentConfig.tsx` - 智能体配置
- `src/pages/MCPToolCenter.tsx` - MCP工具
- `src/pages/Settings.tsx` - 设置

### 核心模块
```
src/modules/
├── recorder/     - 录制功能
├── workflow/     - 工作流处理
├── element/      - UI元素管理
├── runtime/      - 执行和调试
├── agent/        - AI智能体
├── mcp/          - 工具集成
├── template/     - 模板管理
├── task/         - 任务管理
└── security/     - 安全和权限
```

## 开发工作流示例

### 示例 1: 添加新页面

```typescript
// 1. 创建 src/pages/MyNewPage.tsx
import React from 'react';

const MyNewPage: React.FC = () => {
  return <div>My New Page</div>;
};

export default MyNewPage;

// 2. 在 src/App.tsx 中添加路由
<Route path="/mynewpage" element={<MyNewPage />} />

// 3. 在 src/components/Layout.tsx 中添加导航
{ path: '/mynewpage', label: 'My Page', icon: MyIcon }
```

### 示例 2: 使用状态管理

```typescript
// 在组件中使用 Zustand store
import { useAppStore } from '@store';

export const MyComponent = () => {
  const workflows = useAppStore((state) => state.workflows);
  const addWorkflow = useAppStore((state) => state.addWorkflow);

  return (
    <div>
      {workflows.map((wf) => (
        <div key={wf.id}>{wf.name}</div>
      ))}
      <button onClick={() => addWorkflow(newWorkflow)}>
        Add Workflow
      </button>
    </div>
  );
};
```

### 示例 3: 调用模块服务

```typescript
// 使用录制服务
import { RecorderService } from '@modules/recorder';

const recorder = new RecorderService({
  captureMouseMovement: true,
  captureScreenshots: true,
});

recorder.on('recordingStarted', (session) => {
  console.log('Recording started:', session.id);
});

const session = recorder.startRecording();
```

## 调试技巧

### 1. 查看 Electron 主进程日志
- 主进程在启动时自动打开开发工具
- 查看 Console 标签页查看主进程日志

### 2. 查看 React 组件日志
- 按 F12 打开开发工具
- 使用 React DevTools 扩展
- 在 Console 标签页中查看日志

### 3. 检查 IPC 通信
```typescript
// 在主进程中
ipcMain.handle('channel', async (event, args) => {
  console.log('[IPC]', 'Received:', args);
  return result;
});

// 在渲染进程中
const result = await window.electron.ipcRenderer.invoke('channel', data);
console.log('[IPC]', 'Response:', result);
```

### 4. 使用环境变量调试
```bash
# 启用详细日志
REACT_APP_DEBUG=true npm run dev
```

## 常见问题

### Q: 应用启动时白屏
**A:** 这通常是因为 React 开发服务器还没启动。等待几秒钟，或检查终端输出。

### Q: 模块找不到错误
**A:** 检查导入路径是否正确，运行 `npm run type-check` 检查类型错误。

### Q: 样式不生效
**A:** 确保在组件中导入了 CSS 文件。例如：`import './pages.css'`

### Q: 主进程修改后需要重启
**A:** 对 `src/main/` 中的文件修改后，需要手动重启 Electron（关闭并重新运行 `npm run dev`）。

### Q: 依赖安装失败
**A:** 尝试清除缓存：
```bash
rm -rf node_modules package-lock.json
npm install
```

## 下一步

1. **阅读架构文档**: [ARCHITECTURE.md](ARCHITECTURE.md)
   - 了解系统设计
   - 学习模块交互
   - 了解数据流

2. **阅读开发指南**: [DEVELOPMENT.md](DEVELOPMENT.md)
   - 代码规范
   - 编码最佳实践
   - 常见任务

3. **浏览源代码**:
   - 从 `src/App.tsx` 开始
   - 理解路由结构
   - 查看页面组件实现

4. **创建你的第一个工作流**:
   - 使用录制功能录制步骤
   - 在工作流编辑器中编辑
   - 执行工作流

5. **实现自定义模块**:
   - 创建新的模块
   - 集成到应用中
   - 为模块编写单元测试

## 资源链接

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [React Router 文档](https://reactrouter.com)

## 获取帮助

- 查看项目文档：README.md, ARCHITECTURE.md, DEVELOPMENT.md
- 查看代码注释和 JSDoc
- 提交 Issue 或 Discussion
- 联系开发团队

---

祝你开发愉快！🎉
