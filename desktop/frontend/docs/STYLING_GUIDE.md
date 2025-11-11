# 样式使用指南

## 概述

本项目使用统一的样式系统，包含预定义的CSS类和组件。所有页面都应该使用这些统一的样式，以确保一致性。

## 快速开始

### 1. 页面布局

使用预定义的布局类：

```tsx
export function MyPage() {
  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <h1 className="text-xl font-bold text-jarvis-text">页面标题</h1>
        <Button variant="primary">操作按钮</Button>
      </div>

      {/* 内容区域 */}
      <div className="jarvis-content jarvis-scrollbar">
        {/* 页面内容 */}
      </div>
    </div>
  );
}
```

### 2. 卡片布局

```tsx
<div className="jarvis-card">
  <h3 className="text-lg font-semibold text-jarvis-text mb-4">卡片标题</h3>
  <p className="text-jarvis-text-secondary">卡片内容</p>
</div>
```

### 3. 表单元素

```tsx
<div>
  <label className="jarvis-label">输入框标签</label>
  <input 
    type="text" 
    className="jarvis-input" 
    placeholder="请输入..."
  />
</div>
```

### 4. 状态提示

```tsx
{/* 错误提示 */}
<div className="jarvis-error">
  操作失败，请重试
</div>

{/* 成功提示 */}
<div className="jarvis-success">
  操作成功！
</div>

{/* 警告提示 */}
<div className="jarvis-warning">
  请注意检查输入
</div>

{/* 信息提示 */}
<div className="jarvis-info">
  这是一条提示信息
</div>
```

### 5. 空状态

```tsx
<div className="jarvis-empty">
  <div className="text-4xl mb-4">📦</div>
  <p>暂无数据</p>
</div>
```

### 6. 加载状态

```tsx
<div className="flex items-center justify-center py-12">
  <div className="jarvis-loading"></div>
</div>
```

## 预定义类列表

### 布局类

| 类名 | 说明 |
|------|------|
| `jarvis-page` | 页面容器（全高，flex列布局，深色背景） |
| `jarvis-header` | 页面头部（固定高度，边框，内边距） |
| `jarvis-content` | 内容区域（可滚动，内边距） |
| `jarvis-section` | 区块容器（面板背景，边框，内边距） |
| `jarvis-divider` | 分隔线 |

### 组件类

| 类名 | 说明 |
|------|------|
| `jarvis-card` | 卡片容器（面板背景，边框，悬停效果） |
| `jarvis-input` | 输入框（统一样式，焦点效果） |
| `jarvis-label` | 表单标签 |
| `jarvis-scrollbar` | 自定义滚动条 |

### 状态类

| 类名 | 说明 |
|------|------|
| `jarvis-error` | 错误提示（红色） |
| `jarvis-success` | 成功提示（绿色） |
| `jarvis-warning` | 警告提示（黄色） |
| `jarvis-info` | 信息提示（蓝色） |
| `jarvis-empty` | 空状态容器 |
| `jarvis-loading` | 加载动画 |

## 颜色使用

### Tailwind类

```tsx
{/* 背景色 */}
<div className="bg-jarvis-space">深色背景</div>
<div className="bg-jarvis-panel">面板背景</div>

{/* 文本色 */}
<p className="text-jarvis-text">主要文本</p>
<p className="text-jarvis-text-secondary">次要文本</p>

{/* 主题色 */}
<div className="bg-jarvis-gold">金色背景</div>
<div className="text-jarvis-gold">金色文本</div>
<div className="border-jarvis-gold">金色边框</div>
```

### CSS变量

在自定义样式中使用：

```css
.custom-element {
  background-color: var(--color-bg-panel);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}
```

## 组件使用

### Button组件

```tsx
import { Button } from '@/components/ui';

{/* 主要按钮 */}
<Button variant="primary">确定</Button>

{/* 次要按钮 */}
<Button variant="secondary">取消</Button>

{/* 轮廓按钮 */}
<Button variant="outline">详情</Button>

{/* 幽灵按钮 */}
<Button variant="ghost">更多</Button>

{/* 危险按钮 */}
<Button variant="danger">删除</Button>

{/* 加载状态 */}
<Button variant="primary" loading={isLoading}>
  保存中...
</Button>

{/* 不同尺寸 */}
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
```

## 响应式设计

使用Tailwind的响应式前缀：

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 移动端1列，平板2列，桌面3列 */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* 响应式文本大小 */}
</div>
```

## 最佳实践

### ✅ 推荐做法

1. **使用预定义类**
```tsx
<div className="jarvis-card">
  <h3 className="jarvis-label">标题</h3>
  <input className="jarvis-input" />
</div>
```

2. **使用Button组件**
```tsx
<Button variant="primary" onClick={handleClick}>
  操作
</Button>
```

3. **使用主题色**
```tsx
<div className="bg-jarvis-panel text-jarvis-text">
  内容
</div>
```

### ❌ 避免做法

1. **不要使用硬编码颜色**
```tsx
{/* 错误 */}
<div className="bg-blue-500 text-white">

{/* 正确 */}
<div className="bg-jarvis-panel text-jarvis-text">
```

2. **不要重复定义样式**
```tsx
{/* 错误 */}
<button className="px-4 py-2 bg-yellow-500 rounded-lg">

{/* 正确 */}
<Button variant="primary">
```

3. **不要混用不同的样式系统**
```tsx
{/* 错误 - 混用内联样式 */}
<div style={{ backgroundColor: '#FFB800' }}>

{/* 正确 - 使用Tailwind类 */}
<div className="bg-jarvis-gold">
```

## 更新全局样式

如果需要更新全局样式，只需修改以下文件：

1. **颜色和变量**: `src/styles/theme.css`
2. **Tailwind配置**: `tailwind.config.js`
3. **全局CSS**: `src/index.css`

修改后，所有使用这些样式的页面都会自动更新。

## 示例页面

参考以下页面的实现：

- `src/pages/Agent/AgentListPage.tsx` - 列表页面示例
- `src/pages/System/SoftwareScannerPage.tsx` - 扫描页面示例
- `src/pages/System/SystemMonitorPage.tsx` - 监控页面示例

## 常见问题

### Q: 如何添加自定义样式？

A: 优先使用Tailwind类，如果需要自定义，使用CSS变量：

```tsx
<div 
  className="jarvis-card"
  style={{
    borderColor: 'var(--color-primary)',
  }}
>
  内容
</div>
```

### Q: 如何实现悬停效果？

A: 使用Tailwind的`hover:`前缀：

```tsx
<div className="bg-jarvis-panel hover:bg-jarvis-panel-light transition-colors">
  悬停变色
</div>
```

### Q: 如何实现动画？

A: 使用预定义的动画类或Tailwind动画：

```tsx
<div className="animate-pulse-glow">
  脉冲动画
</div>

<div className="transition-all duration-300 hover:scale-105">
  缩放动画
</div>
```
