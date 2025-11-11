# 贾维斯设计系统规范

**版本**: V2.0  
**日期**: 2025-11-08  
**适用范围**: PC端、管理后台、移动端

---

## 1. 设计理念

### 核心原则
- **极简至上**: 复杂功能简单化
- **对话优先**: 自然语言交互
- **沉浸式未来感**: 钢铁侠贾维斯的科技美学
- **隐形设计**: 功能强大但UI克制

### 设计目标
- ✅ 0学习成本：说话就能用
- ✅ 0视觉干扰：不用时静默待命
- ✅ 0复杂操作：AI理解意图，自动执行

---

## 2. 色彩系统

### 主色调：贾维斯金（Jarvis Gold）

```
主色系:
├─ Primary:       #FFB800  // 标志性科技黄
├─ Primary Light: #FFD966  // 高亮、悬停
├─ Primary Dark:  #CC9300  // 按下、激活
└─ Primary Glow:  #FFB800 + 60% opacity + blur

辅助色系:
├─ Arc Blue:      #00D9FF  // 反应堆蓝
├─ Cyber Purple:  #9D4EDD  // AI思考状态
├─ Success:       #00F5A0  // 成功
├─ Warning:       #FF6B35  // 警告
└─ Error:         #FF006E  // 错误

背景色系（暗色主题）:
├─ Deep Space:    #0A0E27  // 主背景
├─ Dark Panel:    #1A1F3A  // 卡片背景
├─ Elevation 1:   #252A4A  // 悬浮层1
├─ Elevation 2:   #2E3558  // 悬浮层2
└─ Overlay:       #0A0E27 + 80% opacity

文字色系:
├─ Primary:       #FFFFFF  // 主要文字
├─ Secondary:     #A8B2D1  // 次要文字
├─ Tertiary:      #6B7A99  // 三级文字
└─ Disabled:      #3D4663  // 禁用文字
```

### 管理后台色彩（专业版）

```
主色: #D4AF37  // 贾维斯金（稍微柔和）

功能色:
├─ Success:  #52C41A
├─ Warning:  #FAAD14
├─ Error:    #FF4D4F
└─ Info:     #1890FF

中性色（浅色模式）:
├─ Text Primary:   #262626
├─ Text Secondary: #595959
├─ Border:         #D9D9D9
├─ Background:     #F5F5F5
└─ Container:      #FFFFFF
```

---

## 3. 字体系统

### PC端字体

```
英文:
├─ Primary:   'Orbitron', sans-serif      // 未来科技感
├─ Secondary: 'Rajdhani', sans-serif      // 数字、代码
└─ Monospace: 'JetBrains Mono', monospace

中文:
├─ Primary:   'HarmonyOS Sans SC'  // 鸿蒙黑体
├─ Secondary: 'PingFang SC'        // 苹方
└─ Fallback:  'Microsoft YaHei'

字号规范:
├─ Hero:   48px/56px  Bold    // 登录页、欢迎页
├─ H1:     32px/40px  Semibold // 页面主标题
├─ H2:     24px/28px  Semibold // 区块标题
├─ H3:     18px/20px  Medium   // 卡片标题
├─ Body:   14px/16px  Regular  // 主要内容
├─ Small:  12px/14px  Regular  // 辅助信息
└─ Tiny:   11px/12px  Regular  // 标签、角标
```

### 管理后台字体

```
字体家族:
├─ 中文: -apple-system, 'PingFang SC', 'Microsoft YaHei'
└─ 英文: -apple-system, 'Segoe UI', Roboto

字号规范:
├─ H1: 24px Bold       // 页面标题
├─ H2: 20px Semibold   // 区块标题
├─ H3: 16px Semibold   // 卡片标题
├─ Body: 14px Regular  // 主要内容
└─ Caption: 12px       // 辅助信息
```

### 移动端字体

```
iOS:
├─ 标题: SF Pro Display
└─ 正文: SF Pro Text

Android:
└─ 全部: Roboto

中文优化: Noto Sans CJK

字号规范:
├─ H1: 28pt/sp Bold
├─ H2: 22pt/sp Semibold
├─ H3: 18pt/sp Semibold
├─ Body: 15pt/sp Regular
└─ Caption: 13pt/sp Regular
```

---

## 4. 间距系统

### PC端（8px基础网格）

```
├─ xs:   4px   // 极小间距
├─ sm:   8px   // 小间距
├─ md:   16px  // 中等间距（最常用）
├─ lg:   24px  // 大间距
├─ xl:   32px  // 超大间距
├─ 2xl:  48px  // 特大间距
└─ 3xl:  64px  // 极大间距

常用场景:
├─ 组件内边距: 8px/12px/16px
├─ 组件间距:   16px/24px
├─ 区块间距:   32px/48px
└─ 页面边距:   24px/32px
```

### 移动端（4pt基础网格）

```
├─ xs:  4pt   // 极小间距
├─ sm:  8pt   // 小间距
├─ md:  16pt  // 中间距（最常用）
├─ lg:  24pt  // 大间距
├─ xl:  32pt  // 超大间距
└─ xxl: 48pt  // 页面级间距

安全区域:
├─ 顶部状态栏: 动态适配刘海屏
├─ 底部Home指示器: iOS 34pt, Android 16pt
└─ 左右边距: 16pt
```

---

## 5. 圆角系统

### PC端

```
├─ none:  0px     // 无圆角
├─ sm:    4px     // 按钮、输入框
├─ md:    8px     // 卡片
├─ lg:    12px    // 面板
├─ xl:    16px    // 对话框
├─ 2xl:   24px    // 悬浮球待命
└─ full:  9999px  // 完全圆形
```

### 移动端

```
├─ Card:   12pt  // 卡片
├─ Button: 8pt   // 按钮
├─ Input:  8pt   // 输入框
├─ Tag:    4pt   // 标签
├─ Avatar: 50%   // 头像
└─ Badge:  10pt  // 徽章
```

---

## 6. 阴影系统

### PC端

```
Level 0（贴地）:
box-shadow: none;

Level 1（卡片）:
box-shadow: 
  0 2px 8px rgba(255, 184, 0, 0.1),
  0 1px 3px rgba(0, 0, 0, 0.3);

Level 2（悬浮面板）:
box-shadow: 
  0 4px 16px rgba(255, 184, 0, 0.15),
  0 2px 6px rgba(0, 0, 0, 0.4);

Level 3（弹窗）:
box-shadow: 
  0 8px 32px rgba(255, 184, 0, 0.2),
  0 4px 12px rgba(0, 0, 0, 0.5);

Glow（发光效果）:
box-shadow: 
  0 0 20px rgba(255, 184, 0, 0.6),
  0 0 40px rgba(255, 184, 0, 0.3),
  0 0 60px rgba(255, 184, 0, 0.1);
```

### 移动端

```
Elevation 1（卡片）:
iOS:     shadow(0 2 4 rgba(0,0,0,0.1))
Android: elevation(2)

Elevation 2（浮动按钮）:
iOS:     shadow(0 4 8 rgba(0,0,0,0.15))
Android: elevation(4)

Elevation 3（对话框）:
iOS:     shadow(0 8 16 rgba(0,0,0,0.2))
Android: elevation(8)
```

---

## 7. 图标系统

### 图标库
- **主要**: Lucide Icons
- **自定义**: 贾维斯Logo、全息特效、语音波形

### 图标规范

```
尺寸:
├─ 16px: 列表图标、按钮图标
├─ 20px: 导航图标
├─ 24px: 标题图标
└─ 32px: 大图标、Logo

样式:
├─ 线宽: 1.5px / 2px
├─ 颜色: 继承文字色或主题色
└─ 圆角: 2px
```

---

## 8. 动效规范

### 过渡动画

```
Duration:
├─ Fast:   150ms  // 按钮悬停、小元素
├─ Normal: 300ms  // 页面切换、对话框
└─ Slow:   500ms  // 大型动画、加载

Easing:
├─ ease-in-out:  默认
├─ ease-out:     进入动画
└─ ease-in:      退出动画
```

### 常用动画

```
淡入淡出:
opacity: 0 → 1 (300ms ease-out)

缩放:
scale: 0.95 → 1 (300ms ease-out)

滑入:
translateY: 20px → 0 (300ms ease-out)

发光脉冲:
box-shadow: 循环动画 (2s ease-in-out infinite)
```

---

## 9. 组件规范

### 按钮

```
Primary Button:
├─ 背景: 金色渐变
├─ 文字: 白色
├─ 高度: 40px
├─ 圆角: 8px
├─ Padding: 12px 24px
└─ 悬停: scale(1.02) + 增强发光

Secondary Button:
├─ 背景: 透明
├─ 边框: 1px solid 金色
├─ 文字: 金色
└─ 悬停: 背景 rgba(255,184,0,0.1)

Ghost Button:
├─ 背景: 透明
├─ 边框: none
├─ 文字: 灰色
└─ 悬停: 文字白色 + 背景淡色
```

### 输入框

```
基础样式:
├─ 高度: 40px
├─ 背景: rgba(37, 42, 74, 0.6)
├─ 边框: 1px solid rgba(255,184,0,0.2)
├─ 圆角: 8px
├─ Padding: 0 12px
└─ 文字: 14px 白色

聚焦状态:
├─ 边框: 1px solid #FFB800
└─ 阴影: 0 0 0 3px rgba(255,184,0,0.1)

错误状态:
├─ 边框: 1px solid #FF006E
└─ 阴影: 0 0 0 3px rgba(255,0,110,0.1)
```

### 卡片

```
基础卡片:
├─ 背景: rgba(37, 42, 74, 0.8)
├─ 边框: 1px solid rgba(255,255,255,0.05)
├─ 圆角: 12px
├─ Padding: 20px
└─ 阴影: Level 1

可交互卡片:
├─ Cursor: pointer
├─ 悬停: translateY(-2px) + 阴影Level 2
└─ 点击: 金色闪光效果
```

---

## 10. 响应式设计

### PC端断点

```
├─ Small:  1024px - 1279px
├─ Medium: 1280px - 1919px
└─ Large:  1920px+
```

### 移动端适配

```
├─ 小屏: 4.7寸 (375x667)
├─ 中屏: 6.1寸 (390x844)
└─ 大屏: 6.7寸+ (428x926)

平板:
├─ iPad: 768x1024
└─ iPad Pro: 1024x1366
```

---

## 11. 无障碍设计

### 对比度
- 正常文字: 至少 4.5:1
- 大文字(18px+): 至少 3:1
- 图标: 至少 3:1

### 键盘导航
- 所有交互元素可通过Tab访问
- 焦点状态清晰可见
- 支持快捷键操作

### 屏幕阅读器
- 图片提供alt文本
- 按钮提供aria-label
- 表单提供label关联

---

## 12. 设计资源

### Figma设计文件
- [待补充] PC端设计文件
- [待补充] 管理后台设计文件
- [待补充] 移动端设计文件

### 设计组件库
- [待补充] Figma组件库
- [待补充] React组件库
- [待补充] 图标库

---

**下一步**: 查看各阶段的UI设计文档
