# 测试账号说明

## 云服务认证

应用现在使用真实的云服务 API 进行认证（运行在 `http://localhost:8080`）。

## 如何创建测试账号

由于云服务对邮箱有严格验证，你需要使用真实的邮箱地址注册。

### 方法1: 使用 API 注册

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "你的用户名",
    "password": "你的密码",
    "email": "你的真实邮箱@gmail.com"
  }'
```

### 方法2: 在应用中注册

1. 启动应用
2. 在登录页面点击"立即注册"（需要先实现注册页面）
3. 填写信息并提交

## 已存在的测试账号

根据之前的错误信息，系统中已经有一个 `test` 用户，但我们不知道密码。

## 登录测试

使用你注册的账号登录：

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "你的邮箱",
    "password": "你的密码"
  }'
```

成功后会返回：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "your_email",
      "username": "your_username"
    }
  }
}
```

## 在应用中登录

1. 启动应用：`npm start`
2. 打开登录页面
3. 输入邮箱和密码
4. 点击登录

登录成功后会自动跳转到主页面。

## 注意事项

1. **邮箱验证**：云服务使用 Clerk 进行认证，需要真实的邮箱地址
2. **密码要求**：密码长度至少 8 位
3. **Token 存储**：登录成功后 token 会保存到：
   - 系统密钥库（Tauri keychain）
   - localStorage（备份）

## 开发模式

如果你想跳过认证进行开发，可以：

1. 修改路由配置，移除认证保护
2. 或者使用模拟登录（之前的实现）

但建议使用真实认证，这样可以测试完整的功能流程。
