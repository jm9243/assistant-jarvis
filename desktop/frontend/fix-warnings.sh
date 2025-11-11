#!/bin/bash

# 修复未使用的导入
echo "修复未使用的导入..."

# ModelConfigForm.tsx - 删除未使用的LLMProvider
sed -i '' 's/import { LLMProvider } from/import {/' desktop/frontend/src/components/agent/ModelConfigForm.tsx

# ToolCard.tsx - 删除未使用的useState
sed -i '' "s/import { useState } from 'react';//" desktop/frontend/src/components/tool/ToolCard.tsx

# ExecutionCenter.tsx - 删除未使用的导入
sed -i '' "s/import { apiService } from '..\/..\/services\/api';//" desktop/frontend/src/pages/Execution/ExecutionCenter.tsx

# RecorderPage.tsx - 删除未使用的RecordedStep
sed -i '' "s/import { RecordedStep } from '..\/..\/types';//" desktop/frontend/src/pages/Recorder/RecorderPage.tsx

echo "完成！"
