# Desktop Recorder Workflow

一个强大的跨平台桌面应用，用于录制用户操作、创建可视化工作流、执行自动化任务。支持 macOS 和 Windows。

## 功能特性

### 1. 录制模块 (Recorder)
- 捕捉用户的真实电脑操作
- 自动识别 UI 元素
- 生成可重放的结构化步骤
- 自动生成选择器和参数提取

### 2. 工作流编辑器 (Workflow Editor)
- 可视化流程节点编辑
- 支持条件、循环、并行操作
- 变量和参数管理
- 错误处理策略

### 3. 元素管理 (Element Manager)
- UI 元素属性查看和编辑
- 自动生成和编辑选择器
- 稳定性评分和命中率统计
- 选择器验证和测试

### 4. 执行和调试 (Runtime & Debugger)
- 流程执行与暂停/继续
- 断点调试功能
- 运行日志和可视化时间轴
- 执行截图和回放

### 5. 智能体节点 (Agent Node)
- AI 驱动的决策制定
- 动态适应和自愈能力
- 失败恢复和重试策略
- 决策日志记录

### 6. MCP 工具集成 (MCP Integration)
- 工作流作为 MCP 工具暴露
- 参数和返回值定义
- AI 调用日志和访问控制

### 7. 模板中心 (Template Center)
- 预制工作流模板
- 应用专用模板库
- 模板导入/导出
- 版本管理

### 8. 任务中心 (Task Center)
- 任务执行历史
- 调度和触发管理
- 执行报告导出
- 批量任务管理

### 9. 权限和安全 (Security)
- 权限申请和管理
- 敏感数据遮罩
- 凭据安全存储
- 审计日志

### 10. 设置和扩展 (Settings)
- 系统配置
- 插件管理
- UI 个性化
- 版本更新

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts            # 主进程入口
│   └── preload.ts          # IPC 预加载脚本
├── pages/                   # React 页面组件
│   ├── Dashboard.tsx
│   ├── RecorderPage.tsx
│   ├── WorkflowEditor.tsx
│   ├── ElementManager.tsx
│   ├── TaskCenter.tsx
│   ├── TemplateCenter.tsx
│   ├── AgentConfig.tsx
│   ├── MCPToolCenter.tsx
│   └── Settings.tsx
├── components/              # 可复用组件
│   ├── Layout.tsx
│   └── Layout.css
├── modules/                 # 功能模块
│   ├── recorder/            # 录制模块
│   ├── workflow/            # 工作流模块
│   ├── element/             # 元素管理
│   ├── runtime/             # 执行和调试
│   ├── agent/               # 智能体模块
│   ├── mcp/                 # MCP 集成
│   ├── template/            # 模板中心
│   ├── task/                # 任务管理
│   └── security/            # 安全和权限
├── store/                   # 状态管理 (Zustand)
├── types/                   # 类型定义
├── utils/                   # 工具函数
├── index.tsx               # React 入口
├── App.tsx                 # 主应用组件
└── index.css               # 全局样式

public/
└── index.html              # HTML 模板

```

## 技术栈

- **前端框架**: React 18
- **桌面框架**: Electron 27
- **类型系统**: TypeScript 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **UI 库**: Lucide Icons
- **样式**: CSS3
- **构建工具**: Create React App + TypeScript

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将同时启动 React 开发服务器和 Electron 应用。

### 构建

```bash
# 构建 React 和 Electron
npm run build

# 打包成应用
npm run dist

# 仅 macOS
npm run dist:mac

# 仅 Windows
npm run dist:win

# 仅 Linux
npm run dist:linux
```

## API 文档

### 核心模块

#### RecorderService
记录用户操作

```typescript
const recorder = new RecorderService();
const session = recorder.startRecording();
recorder.addStep({
  type: 'click',
  element: elementData,
  data: { x: 100, y: 200 }
});
const finalSession = recorder.stopRecording();
```

#### WorkflowEngine
执行工作流

```typescript
const engine = new WorkflowEngine();
const context = await engine.execute(workflow, variables);
```

#### ElementManager
管理 UI 元素

```typescript
const manager = new ElementManager();
manager.addElement(element);
const selector = SelectorGenerator.generateSelectors(element);
```

#### RuntimeEngine
执行和监控

```typescript
const runtime = new RuntimeEngine();
const execution = await runtime.executeWorkflow(workflowId, inputs);
```

## 配置

### 编辑器配置 (tsconfig.json)

支持路径别名:
- `@/*` - src 根目录
- `@components/*` - components 目录
- `@pages/*` - pages 目录
- `@modules/*` - modules 目录
- `@utils/*` - utils 目录
- `@store/*` - store 目录
- `@types/*` - types 目录

### 应用配置 (package.json)

- `electron`: Electron 版本
- `electron-builder`: 打包配置
- `build` 字段: 应用元数据和打包选项

## 开发指南

### 添加新页面

1. 在 `src/pages/` 中创建新组件
2. 在 `src/App.tsx` 中添加路由
3. 在 `src/components/Layout.tsx` 中添加导航项

### 添加新模块

1. 在 `src/modules/` 中创建模块目录
2. 定义类型 (`types.ts`)
3. 实现核心类 (e.g., `Service.ts`)
4. 导出接口 (`index.ts`)

### 跨平台考虑

- 使用 `platform` 检测 (macOS vs Windows)
- 使用 `ipcRenderer` 进行进程间通信
- 使用系统 API (AX for macOS, UIA for Windows)

## 许可证

MIT

## 贡献

欢迎提交 Pull Request！

## 支持

如有问题或建议，请提交 Issue。
