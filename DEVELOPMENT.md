# 开发指南

## 开发环境设置

### 前置要求

- Node.js 16+ 
- npm 8+ 或 yarn
- Git
- macOS 10.13+ 或 Windows 10+

### 初始化

```bash
# 克隆仓库
git clone <repo-url>
cd desktop-recorder-workflow

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

## 代码结构规范

### 目录结构

```
src/
├── main/              # Electron 主进程代码
├── pages/             # React 页面组件
├── components/        # 可复用 React 组件
├── modules/           # 核心业务逻辑模块
├── store/             # 全局状态管理
├── types/             # TypeScript 类型定义
├── utils/             # 工具函数
├── App.tsx            # 应用主组件
├── index.tsx          # React 入口点
└── index.css          # 全局样式
```

### 命名约定

- **文件名**: PascalCase（组件）或 camelCase（模块）
- **类名**: PascalCase
- **函数名**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **接口**: IPascalCase 或 PascalCase（类型）

### 导入路径

使用别名导入以提高可读性：

```typescript
// ✓ 正确
import { Layout } from '@components/Layout';
import { useAppStore } from '@store';
import { generateId } from '@utils';

// ✗ 避免
import { Layout } from '../../../components/Layout';
import { useAppStore } from '../../../store';
```

## 编码标准

### TypeScript 风格

```typescript
// 使用明确的类型注解
interface UserData {
  name: string;
  age: number;
}

// 使用 const 断言
const permissions = [
  'read',
  'write',
  'admin',
] as const;

// 使用工厂函数而不是 new
function createUser(name: string): User {
  return { name };
}

// 避免 any，使用 unknown 然后 type guard
function process(data: unknown) {
  if (typeof data === 'string') {
    // data 现在是 string
  }
}
```

### React 组件

```typescript
// 使用函数组件和 hooks
import React, { useState, useEffect } from 'react';

interface ComponentProps {
  title: string;
  onSubmit?: (value: string) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onSubmit }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    // 副作用逻辑
  }, []);

  const handleSubmit = () => {
    onSubmit?.(value);
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default MyComponent;
```

### 模块设计

```typescript
// types.ts - 类型定义
export interface Config {
  enabled: boolean;
  timeout: number;
}

// Service.ts - 核心逻辑
export class MyService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  execute(): void {
    // 实现
  }
}

// index.ts - 导出接口
export { MyService } from './Service';
export * from './types';
```

## 开发工作流

### 创建新功能

1. **创建分支**
   ```bash
   git checkout -b feat/feature-name
   ```

2. **实现功能**
   - 创建类型定义
   - 实现核心逻辑
   - 创建 UI 组件
   - 添加状态管理

3. **测试**
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

4. **提交**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feat/feature-name
   ```

### 修复 Bug

1. **创建 bugfix 分支**
   ```bash
   git checkout -b fix/bug-name
   ```

2. **编写测试复现 bug**

3. **修复代码**

4. **验证修复**

5. **提交和推送**

## 调试技巧

### Electron 调试

1. **主进程调试**
   - 在 Chrome DevTools 中打开 `chrome://inspect`
   - 选择 Electron 主进程

2. **渲染进程调试**
   - 按 F12 打开开发工具
   - 使用 Console、Sources、Network 标签

### React 开发者工具

```bash
# 安装 Chrome 扩展
# 然后在开发工具中使用 React 标签
```

### 日志输出

```typescript
// 在主进程中
console.log('[Main]', message);

// 在渲染进程中
console.log('[Renderer]', message);

// 条件日志
if (process.env.REACT_APP_DEBUG) {
  console.debug('Debug info:', data);
}
```

## 集成测试

### 测试代码示例

```typescript
// 单元测试
describe('RecorderService', () => {
  let service: RecorderService;

  beforeEach(() => {
    service = new RecorderService();
  });

  it('should start recording', () => {
    const session = service.startRecording();
    expect(session.isActive).toBe(true);
  });

  it('should add steps', () => {
    service.startRecording();
    service.addStep({
      type: 'click',
      data: { x: 100, y: 200 },
    });
    expect(service.getSteps()).toHaveLength(1);
  });
});
```

### 运行测试

```bash
npm run test                    # 运行所有测试
npm run test -- --watch        # 监视模式
npm run test -- --coverage     # 覆盖率报告
```

## 性能优化

### 代码分割

```typescript
// 使用 React.lazy 进行路由级别的代码分割
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Recorder = React.lazy(() => import('./pages/RecorderPage'));

// 使用 Suspense 处理加载状态
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 防止不必要的重新渲染

```typescript
// 使用 useMemo
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 使用 useCallback
const memoizedCallback = useCallback(() => {
  handleClick(a, b);
}, [a, b]);

// 使用 React.memo
const MyComponent = React.memo(({ name }) => {
  return <div>{name}</div>;
});
```

### 状态管理优化

```typescript
// 订阅特定的状态片段，避免不必要的更新
const name = useAppStore((state) => state.currentWorkflow?.name);
```

## 常见任务

### 添加新页面

1. 创建页面组件：`src/pages/NewPage.tsx`
2. 在 `App.tsx` 中添加路由
3. 在 `Layout.tsx` 中添加导航项
4. 编写页面样式

### 添加新的状态

```typescript
// 在 src/store/index.ts 中
export const useAppStore = create((set) => ({
  // 新的状态
  newState: null,
  setNewState: (value) => set({ newState: value }),
}));
```

### 创建可复用组件

1. 在 `src/components/` 中创建文件夹
2. 编写组件逻辑
3. 定义 Props 接口
4. 导出组件
5. 添加到 `src/components/index.ts`

### 添加工具函数

1. 在 `src/utils/index.ts` 中添加函数
2. 添加 JSDoc 注释
3. 编写单元测试

## 提交信息规范

遵循 Conventional Commits：

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码风格（不影响逻辑）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建、依赖等维护
- `ci`: CI 配置

### 示例

```
feat(recorder): add support for drag and drop recording

- Detect drag start and drop events
- Generate drag-drop steps with coordinates
- Add visual feedback during recording

Closes #123
```

## 发布流程

### 版本管理

遵循语义版本控制 (SemVer)：
- `MAJOR`: 不兼容的 API 更改
- `MINOR`: 向后兼容的新功能
- `PATCH`: 向后兼容的 bug 修复

### 发布步骤

```bash
# 1. 更新版本
npm version minor  # 或 major/patch

# 2. 构建应用
npm run build
npm run dist

# 3. 测试发布版本
# 手动测试应用功能

# 4. 创建 GitHub Release
git tag v1.0.0
git push origin v1.0.0

# 5. 上传构建产物
# 上传 .dmg 和 .exe 文件到 release
```

## 故障排除

### 常见问题

**Q: 开发服务器无法启动**
```bash
# 清除缓存
rm -rf node_modules
npm install
npm run dev
```

**Q: 类型检查失败**
```bash
# 检查类型错误
npm run type-check

# 修复 tsconfig.json 或代码
```

**Q: 样式不生效**
```bash
# 确保导入 CSS
import './Component.css';

# 检查选择器是否正确
# 检查是否有 CSS 冲突
```

**Q: 模块找不到**
```bash
# 检查导入路径
# 检查 tsconfig.json 中的路径别名配置
# 清除 node_modules 和 dist
npm run build
```

## 获取帮助

- 查看 [ARCHITECTURE.md](ARCHITECTURE.md) 了解系统设计
- 查看 [README.md](README.md) 了解项目概览
- 查看源代码注释和 JSDoc
- 提交 Issue 或 Discussion
