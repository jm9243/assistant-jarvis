#!/bin/bash

echo "测试API连接..."
echo ""

echo "1. 测试Python Engine健康检查:"
curl -s http://localhost:8000/health | jq '.' || echo "❌ Python Engine未运行"
echo ""

echo "2. 测试Agent列表API:"
curl -s http://localhost:8000/api/v1/agents | jq '.' || echo "❌ Agent API失败"
echo ""

echo "3. 测试知识库列表API:"
curl -s http://localhost:8000/api/v1/knowledge-bases | jq '.' || echo "❌ 知识库API失败"
echo ""

echo "4. 测试工具列表API:"
curl -s http://localhost:8000/api/v1/tools | jq '.' || echo "❌ 工具API失败"
echo ""

echo "测试完成！"
