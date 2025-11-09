# 助手-贾维斯 Desktop 前端

> 基于 Tauri 2 + React 打造的跨平台桌面应用前端

## 🎯 设计理念

- **极简至上**: 复杂功能简单化，能自动完成的绝不让用户手动
- **对话优先**: 用自然语言交互，而非点击按钮和填写表单
- **沉浸式未来感**: 钢铁侠贾维斯的科技美学，全息、悬浮、流动
- **隐形设计**: 功能强大但UI克制，不打扰时几乎隐形

## 📁 项目结构

```
desktop/
├── src/
│   ├── styles/              # 样式系统
│   │   └── theme.css        # 主题CSS（色彩、字体、间距等）
│   ├── components/          # React组件库
│   │   ├── Button/          # 按钮组件
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   └── index.ts
│   │   ├── Input/           # 输入框组件
│   │   │   ├── Input.tsx
│   │   │   ├── Input.css
│   │   │   └── index.ts
│   │   ├── Card/            # 卡片组件
│   │   │   ├── Card.tsx
│   │   │   ├── Card.css
│   │   │   └── index.ts
│   │   ├── Toast/           # Toast通知组件
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   ├── Toast.css
│   │   │   └── index.ts
│   │   └── index.ts         # 组件总入口
│   ├── pages/               # 页面组件
│   │   └── ComponentShowcase.html  # 组件展示页面
│   ├── assets/              # 静态资源
│   └── utils/               # 工具函数
├── docs/                    # 文档
└── README.md
```

## 🎨 设计系统

### 色彩系统

#### 主色系 - 贾维斯金 (Jarvis Gold)
- **Primary**: `#FFB800` - 标志性科技黄
- **Light**: `#FFD966` - 高亮/悬停
- **Dark**: `#CC9300` - 按下/激活

#### 辅助色系
- **Arc Blue**: `#00D9FF` - 反应堆蓝，次要信息
- **Cyber Purple**: `#9D4EDD` - AI思考状态
- **Success Green**: `#00F5A0` - 成功状态
- **Warning Orange**: `#FF6B35` - 警告状态
- **Error Red**: `#FF006E` - 错误状态

#### 背景色系
- **Deep Space**: `#0A0E27` - 主背景
- **Dark Panel**: `#1A1F3A` - 卡片/面板
- **Elevation 1**: `#252A4A` - 悬浮层1
- **Elevation 2**: `#2E3558` - 悬浮层2

### 字体系统

- **英文**: Orbitron (未来科技感)
- **中文**: HarmonyOS Sans SC (现代简洁)
- **代码**: JetBrains Mono (等宽编程)

### 间距系统 (8px网格)

```
xs:  4px    sm:  8px    md:  16px   lg:  24px
xl:  32px   2xl: 48px   3xl: 64px
```

### 圆角系统

```
sm: 4px    md: 8px    lg: 12px   xl: 16px
2xl: 24px  full: 9999px
```

## 🧩 组件库

### Button（按钮组件）

支持4种变体：
- **Primary** - 主按钮（金色渐变 + 发光）
- **Secondary** - 次按钮（透明背景 + 金色边框）
- **Ghost** - 幽灵按钮（完全透明）
- **Danger** - 危险按钮（红色 + 发光）

支持4种尺寸：Tiny、Small、Medium、Large

```tsx
import { Button } from '@/components';

<Button variant="primary" size="medium">
  执行任务
</Button>
```

### Input（输入框组件）

支持多种状态：
- **Default** - 默认状态
- **Error** - 错误状态（红色边框）
- **Success** - 成功状态（绿色边框）
- **Warning** - 警告状态（橙色边框）

支持图标、标签、帮助文本等功能

```tsx
import { Input } from '@/components';

<Input
  label="邮箱地址"
  placeholder="请输入邮箱"
  required
  error="邮箱格式不正确"
/>
```

### Card（卡片组件）

支持3种变体：
- **Default** - 默认卡片
- **Interactive** - 可交互卡片（悬停动画）
- **Glass** - 玻璃拟态卡片（模糊背景）

```tsx
import { Card } from '@/components';

<Card variant="interactive" hoverable onClick={() => {}}>
  <h3>工作流名称</h3>
  <p>工作流描述...</p>
</Card>
```

### Toast（通知组件）

支持4种类型：
- **Success** - 成功通知（绿色）
- **Error** - 错误通知（红色）
- **Warning** - 警告通知（橙色）
- **Info** - 信息通知（蓝色）

```tsx
import { useToast } from '@/components';

const { success, error, warning, info } = useToast();

success('操作成功', '工作流执行成功');
error('操作失败', '网络连接超时');
```

### JarvisOrb（悬浮球组件）

智能AI助手悬浮球，支持多种交互状态：
- **Idle** - 待机状态（呼吸动画）
- **Listening** - 聆听状态（波纹扩散）
- **Thinking** - 思考状态（紫色光晕）
- **Working** - 工作状态（进度环）

核心功能：
- 拖拽移动 + 边缘吸附
- 点击展开对话面板
- 支持文字和语音输入
- 聊天历史记录
- 快捷操作建议

```tsx
import { JarvisOrb } from '@/components';

<JarvisOrb
  draggable
  snapToEdge
  initialState="idle"
  onSendMessage={async (msg) => {
    // 处理消息
    return 'AI回复';
  }}
/>
```

## 🖥️ 页面展示

### ComponentShowcase.html
组件展示页面，查看所有基础组件的实时效果和使用示例。

### Login.html
登录页面，采用左右分屏设计：
- 左侧：品牌展示区（星空背景 + 3D贾维斯球体）
- 右侧：登录表单（邮箱/密码 + 第三方登录）

### Dashboard.html
主页面，包含：
- 可展开/收起的侧边栏导航
- 欢迎卡片（时间问候 + 快捷操作）
- 快速统计（执行次数、成功率、活跃Agent、通知）
- 最近任务列表
- 活跃工作流列表
- 快捷操作和系统状态

### Workflows.html
工作流列表页，包含：
- 搜索和筛选功能（支持Cmd+K快捷键）
- 状态过滤标签（全部、运行中、已停止、草稿、已发布）
- 3列响应式工作流卡片网格
- 工作流卡片展示：缩略图、状态、标题、描述、标签、统计、操作按钮
- 空状态提示

### JarvisOrbDemo.html
JarvisOrb悬浮球组件演示页面，展示完整交互功能。

## 🚀 第一阶段完成进度

✅ **已完成**：
1. 主题CSS系统（色彩、字体、间距、圆角、阴影等）
2. 基础组件库（Button、Input、Card、Toast、JarvisOrb）
3. 组件展示页面
4. 登录页面
5. 主页Dashboard
6. 工作流列表页
7. 导航系统（可展开侧边栏）
8. 悬浮球组件（JarvisOrb）

📅 **待开发（第二阶段）**：
- 工作流详情页
- 工作流编辑器（可视化节点编辑）
- Agent中心页面
- 知识库管理页面
- 设置页面
- 录制功能集成

## 📚 技术栈

- **框架**: Tauri 2 + React 18
- **语言**: TypeScript
- **样式**: CSS + CSS Variables
- **状态管理**: 待定（Zustand/Redux）
- **UI库**: 自研贾维斯组件库

## 🎯 核心特性

### 驾驶舱与引擎分离

- **前端（驾驶舱）**: Tauri 2 + React
  - 负责用户交互和可视化
  - 轻量、高性能
  - 跨平台一致性

- **后端（引擎）**: Python Sidecar
  - 独立的后台进程
  - AI决策、自动化执行
  - 系统级集成

### 响应式设计

- 最小分辨率：1024×600
- 推荐分辨率：1440×800
- 支持1920+超大屏幕

## 🔧 开发指南

### 样式规范

1. **使用CSS变量**
   ```css
   color: var(--jarvis-gold-primary);
   padding: var(--spacing-md);
   border-radius: var(--radius-lg);
   ```

2. **遵循8px网格系统**
   - 所有间距、尺寸都应该是8的倍数
   - 使用预定义的spacing变量

3. **保持组件独立性**
   - 每个组件有独立的.tsx和.css文件
   - 使用BEM命名规范（jarvis-{component}__{element}--{modifier}）

### 组件开发流程

1. 创建组件目录：`components/ComponentName/`
2. 创建组件文件：`ComponentName.tsx`、`ComponentName.css`
3. 创建导出文件：`index.ts`
4. 在 `components/index.ts` 中注册

### 命名规范

- **组件名**: 大驼峰（PascalCase）- `Button`, `JarvisOrb`
- **文件名**: 与组件名一致 - `Button.tsx`, `Button.css`
- **CSS类名**: BEM规范 - `jarvis-button`, `jarvis-button__text`, `jarvis-button--primary`
- **CSS变量**: kebab-case - `--jarvis-gold-primary`, `--spacing-md`

## 📖 相关文档

- [迭代01-产品基座与录制体验.md](../docs/迭代/迭代01-产品基座与录制体验.md)
- [电脑端-UI-UX设计文档.md](../docs/电脑端-UI-UX设计文档.md)

## 📄 License

MIT
