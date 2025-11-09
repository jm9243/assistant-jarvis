# 贾维斯前端

基于 Tauri 2 + React 18 的桌面应用前端。

## 技术栈

- **框架**: Tauri 2
- **UI库**: React 18 + TypeScript
- **状态管理**: Zustand
- **路由**: React Router v6
- **工作流引擎**: React Flow
- **样式**: Tailwind CSS
- **图表**: ECharts
- **构建工具**: Vite

## 目录结构

```
src/
├── app/              # 应用入口
├── pages/            # 页面组件
├── components/       # 通用组件
├── stores/           # Zustand状态管理
├── services/         # API服务层
├── hooks/            # 自定义Hooks
├── utils/            # 工具函数
└── types/            # TypeScript类型
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# Tauri开发
npm run tauri dev

# Tauri构建
npm run tauri build
```

## 规范

详见 [开发规范](../docs/开发规范.md)

