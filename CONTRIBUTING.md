# 贡献指南

感谢你对 Desktop Recorder Workflow 项目的兴趣！本文档描述了如何贡献代码。

## 行为准则

本项目采用了一份行为准则，我们所有贡献者都应该遵守它。请阅读 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解详情。

## 如何贡献

### 1. 报告 Bug

如果发现 bug，请：

1. **检查是否已被报告**: 搜索 [已有的 issues](../../issues)
2. **提供详细信息**:
   - 操作系统和版本
   - 应用版本
   - 重现步骤
   - 预期行为 vs 实际行为
   - 错误日志或截图

### 2. 建议功能

如果有功能想法：

1. **检查是否已被建议**: 搜索 [讨论](../../discussions)
2. **详细描述**:
   - 问题描述（为什么需要）
   - 解决方案描述（如何解决）
   - 备选方案（还有其他方式吗）

### 3. 提交代码

#### 开发环境设置

```bash
# 1. Fork 仓库
# 在 GitHub 上 Fork

# 2. Clone 你的 Fork
git clone https://github.com/YOUR_USERNAME/desktop-recorder-workflow.git
cd desktop-recorder-workflow

# 3. 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/desktop-recorder-workflow.git

# 4. 创建开发分支
git checkout -b feat/your-feature-name

# 5. 安装依赖
npm install
```

#### 开发工作流

```bash
# 1. 做出修改
# 编辑代码...

# 2. 运行测试
npm run type-check
npm run lint

# 3. 构建验证
npm run build

# 4. Commit 代码
git add .
git commit -m "feat: add amazing feature"

# 5. Push 到你的 Fork
git push origin feat/your-feature-name

# 6. 创建 Pull Request
# 在 GitHub 上创建 PR
```

## 代码风格

### 遵循项目风格

- **TypeScript**: 严格模式，无 `any`
- **React**: 函数组件和 hooks
- **命名**: camelCase（函数/变量）, PascalCase（类/组件）
- **格式**: 使用 Prettier（`npm run format`）

### 示例代码

```typescript
// ✅ 好的
interface UserConfig {
  name: string;
  email: string;
}

function createUser(config: UserConfig): User {
  return { id: generateId(), ...config };
}

// ❌ 不好的
function createUser(config: any): any {
  return { id: Math.random(), ...config };
}
```

## Commit 信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（非功能更改）
- `refactor`: 代码重构
- `perf`: 性能改进
- `test`: 测试相关
- `chore`: 构建、依赖等

### 范围 (scope)

- `recorder`: 录制模块
- `workflow`: 工作流模块
- `element`: 元素管理
- `runtime`: 运行时/调试
- `agent`: AI 智能体
- `mcp`: MCP 集成
- `ui`: 用户界面
- `core`: 核心功能

### 示例

```
feat(recorder): implement gesture recording

- Add support for swipe and pinch gestures
- Generate gesture steps with coordinates
- Update element selector for gesture targets

Closes #456
```

## Pull Request 流程

### 提交 PR 前

- [ ] 代码通过 `npm run type-check`
- [ ] 代码通过 `npm run lint`
- [ ] 新功能有相应的测试
- [ ] 更新了相关文档
- [ ] Commit 信息遵循规范

### PR 标题和描述

**标题**: 简洁描述，遵循 Conventional Commits

**描述**:
```markdown
## 描述
简要说明这个 PR 做了什么

## 修复的 Issue
Closes #123

## 更改类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] Breaking change
- [ ] 文档更新

## 测试
描述你如何测试了这些更改

## 检查清单
- [ ] 代码通过 lint 检查
- [ ] 类型检查通过
- [ ] 新功能有测试
- [ ] 文档已更新
```

### 代码审查

- 维护者会审查你的代码
- 可能会要求修改
- 所有检查通过后会 merge

## 测试

### 编写测试

```typescript
import { RecorderService } from '@modules/recorder';

describe('RecorderService', () => {
  let service: RecorderService;

  beforeEach(() => {
    service = new RecorderService();
  });

  it('should start and stop recording', () => {
    const session = service.startRecording();
    expect(session.isActive).toBe(true);

    const stopped = service.stopRecording();
    expect(stopped?.isActive).toBe(false);
  });
});
```

### 运行测试

```bash
npm run test                    # 运行所有测试
npm run test -- --watch        # 监视模式
npm run test -- --coverage     # 覆盖率报告
```

## 文档

### 更新文档

- 新功能应在 README.md 中记录
- 重要的实现细节应在 ARCHITECTURE.md 中记录
- 开发指南应在 DEVELOPMENT.md 中更新

### 代码注释

```typescript
/**
 * 生成唯一标识符
 * @param prefix - 可选的前缀
 * @returns 生成的 ID
 * 
 * @example
 * const id = generateId('user_');
 * // user_1234567890
 */
function generateId(prefix: string = ''): string {
  // 实现...
}
```

## 许可

通过贡献代码，你同意将你的代码在项目的许可证下发布（MIT）。

## 问题和讨论

- 使用 [Discussions](../../discussions) 讨论想法
- 使用 [Issues](../../issues) 报告 bug 或建议功能
- 在 [Slack](https://slack.example.com) 上与开发者交流

## 致谢

感谢所有为这个项目做出贡献的人！

---

最后，如有任何问题，请不要犹豫地提问。我们很乐意帮助！
