# 主题系统说明

## 概述

本项目使用统一的主题系统，所有UI组件都应该使用预定义的颜色和样式，以确保一致性并支持未来的主题切换功能。

## 颜色系统

### Jarvis主题色

在`tailwind.config.js`中定义：

```javascript
colors: {
  jarvis: {
    primary: '#FFB800',      // 主色调（金色）
    gold: '#FFB800',         // 金色
    'gold-dark': '#CC9300',  // 深金色
    space: '#0A0E27',        // 深空蓝（背景）
    'space-light': '#0E1533',// 浅空蓝
    panel: '#1A1F3A',        // 面板背景
    'panel-light': '#252A4A',// 浅面板背景
    text: '#FFFFFF',         // 主文本色
    'text-secondary': '#A8B2D1', // 次要文本色
  },
}
```

### 使用方式

在Tailwind类名中使用：

```tsx
<div className="bg-jarvis-space text-jarvis-text">
  <div className="bg-jarvis-panel border border-white/10">
    <h1 className="text-jarvis-gold">标题</h1>
    <p className="text-jarvis-text-secondary">描述文本</p>
  </div>
</div>
```

## 统一组件

### Button组件

位置：`src/components/ui/Button.tsx`

#### 变体（Variants）

- `primary`: 主要按钮（金色背景）
- `secondary`: 次要按钮（面板背景）
- `outline`: 轮廓按钮（透明背景，边框）
- `ghost`: 幽灵按钮（透明背景，无边框）
- `danger`: 危险按钮（红色）

#### 尺寸（Sizes）

- `sm`: 小尺寸
- `md`: 中等尺寸（默认）
- `lg`: 大尺寸

#### 使用示例

```tsx
import { Button } from '@/components/ui';

// 主要按钮
<Button variant="primary" onClick={handleClick}>
  创建
</Button>

// 次要按钮
<Button variant="secondary" size="sm">
  取消
</Button>

// 加载状态
<Button variant="primary" loading={isLoading}>
  保存中...
</Button>

// 带图标
<Button variant="outline" icon={<PlusIcon />}>
  添加
</Button>

// 全宽按钮
<Button variant="primary" fullWidth>
  提交
</Button>
```

## 最佳实践

### 1. 始终使用主题色

❌ 不要使用：
```tsx
<div className="bg-blue-500 text-white">
```

✅ 应该使用：
```tsx
<div className="bg-jarvis-primary text-jarvis-space">
```

### 2. 使用统一组件

❌ 不要使用：
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  点击
</button>
```

✅ 应该使用：
```tsx
<Button variant="primary">
  点击
</Button>
```

### 3. 保持一致性

- 所有主要操作按钮使用`variant="primary"`
- 所有次要操作按钮使用`variant="secondary"`
- 所有危险操作按钮使用`variant="danger"`
- 筛选/标签按钮使用`variant="ghost"`，选中时使用`variant="primary"`

### 4. 响应式设计

使用Tailwind的响应式前缀：

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 内容 */}
</div>
```

## 未来扩展

### 主题切换

系统设计支持未来添加多主题功能：

1. 在`tailwind.config.js`中添加新主题色
2. 使用CSS变量或Context API切换主题
3. 所有使用主题色的组件会自动适配

### 暗色/亮色模式

可以通过添加`dark:`前缀支持暗色模式：

```tsx
<div className="bg-white dark:bg-jarvis-space text-black dark:text-jarvis-text">
  {/* 内容 */}
</div>
```

## 组件清单

### 已实现

- [x] Button - 按钮组件

### 待实现

- [ ] Input - 输入框组件
- [ ] Select - 选择器组件
- [ ] Modal - 模态框组件
- [ ] Card - 卡片组件
- [ ] Badge - 徽章组件
- [ ] Toast - 提示组件
- [ ] Tabs - 标签页组件

## 贡献指南

添加新组件时：

1. 在`src/components/ui/`目录下创建组件文件
2. 使用主题色和统一的样式规范
3. 导出组件类型定义
4. 在`src/components/ui/index.ts`中导出
5. 更新本文档的组件清单
