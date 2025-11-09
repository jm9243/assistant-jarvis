import { test, expect } from '@playwright/test';

// 占位 E2E 用例：CI 中可针对打包后的前端运行
// 目前仅验证登录页结构，后续可扩展到完整工作流流程

test('login page renders hero content', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await expect(page.getByText('登录助手 · 贾维斯')).toBeVisible();
});
