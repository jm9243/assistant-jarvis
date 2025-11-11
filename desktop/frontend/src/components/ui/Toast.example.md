# Toast 通知组件使用指南

## 基本用法

```typescript
import { toast } from '@/components/ui/Toast';

// 成功提示
toast.success('操作成功', '数据已保存');

// 错误提示
toast.error('操作失败', '请检查网络连接');

// 警告提示
toast.warning('注意', '此操作不可撤销');

// 信息提示
toast.info('提示', '系统将在5分钟后重启');
```

## 高级用法

### 自定义持续时间

```typescript
// 持续10秒
toast.success('操作成功', '数据已保存', { duration: 10000 });

// 不自动关闭
toast.error('严重错误', '请联系管理员', { duration: 0 });
```

### 添加操作按钮

```typescript
toast.error('无法连接到服务器', '请检查网络设置', {
  action: {
    label: '重试',
    onClick: () => {
      // 重试逻辑
      retryConnection();
    }
  }
});
```

## 在组件中使用

```typescript
import { ToastContainer } from '@/components/ui/Toast';

function App() {
  return (
    <>
      {/* 你的应用内容 */}
      <ToastContainer />
    </>
  );
}
```

## 样式定制

Toast组件使用Tailwind CSS，可以通过修改`Toast.tsx`中的类名来定制样式。

## 注意事项

1. `ToastContainer`只需要在应用根组件中添加一次
2. `toast`方法可以在任何地方调用，不需要在React组件内
3. 设置`duration: 0`可以让Toast不自动关闭
4. Toast会自动堆叠显示，最新的在最上面
