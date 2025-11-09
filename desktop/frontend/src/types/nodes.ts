import type { INode } from '@/types';

export type NodeCategory =
  | 'UI自动化'
  | '流程控制'
  | '集成'
  | '文件操作'
  | '系统操作'
  | '时间操作'
  | 'AI操作'
  | '通知'
  | 'Agent调用';

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: string;
  defaultConfig: Record<string, unknown>;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'click',
    label: 'Click 点击',
    description: '单击/双击/右键操作，支持修饰键与偏移',
    category: 'UI自动化',
    icon: '🖱️',
    defaultConfig: {
      action: 'single',
      button: 'left',
      modifiers: [],
      offset: { x: 0, y: 0 },
      waitFor: 500,
    },
  },
  {
    type: 'input',
    label: 'Input 输入',
    description: '输入文本，支持清空与回车确认',
    category: 'UI自动化',
    icon: '⌨️',
    defaultConfig: {
      text: '',
      clearBeforeType: true,
      enterAfter: false,
    },
  },
  {
    type: 'drag',
    label: 'Drag & Drop',
    description: '拖拽元素至目标位置',
    category: 'UI自动化',
    icon: '🫳',
    defaultConfig: {
      speed: 'normal',
      from: 'element',
      to: 'element',
    },
  },
  {
    type: 'scroll',
    label: 'Scroll 滚动',
    description: '上下左右滚动或滚动到元素',
    category: 'UI自动化',
    icon: '🌀',
    defaultConfig: {
      direction: 'down',
      distance: 300,
    },
  },
  {
    type: 'hover',
    label: 'Hover 悬停',
    description: '在元素上悬停指定时长',
    category: 'UI自动化',
    icon: '🪄',
    defaultConfig: {
      duration: 1000,
      offset: { x: 0, y: 0 },
    },
  },
  {
    type: 'keyboard',
    label: 'Keyboard 键盘',
    description: '输入快捷键/组合键',
    category: 'UI自动化',
    icon: '⌨️',
    defaultConfig: {
      keys: ['Enter'],
      delay: 80,
    },
  },
  {
    type: 'delay',
    label: 'Delay 延迟',
    description: '等待指定毫秒',
    category: 'UI自动化',
    icon: '⏱️',
    defaultConfig: {
      milliseconds: 1000,
    },
  },
  {
    type: 'variable',
    label: '变量操作',
    description: '设置/获取/递增变量',
    category: '流程控制',
    icon: '𝑥',
    defaultConfig: {
      action: 'set',
      key: 'varName',
      value: '',
    },
  },
  {
    type: 'compare',
    label: '条件判断',
    description: '比较两个值并产生分支',
    category: '流程控制',
    icon: '⚖️',
    defaultConfig: {
      left: '',
      operator: '==',
      right: '',
    },
  },
  {
    type: 'data-extract',
    label: '数据提取',
    description: '从元素/页面/剪贴板提取文本',
    category: '流程控制',
    icon: '🧾',
    defaultConfig: {
      source: 'element',
      strategy: 'text',
      targetVariable: 'result',
    },
  },
  {
    type: 'http-request',
    label: 'HTTP 请求',
    description: '调用 REST API',
    category: '集成',
    icon: '🌐',
    defaultConfig: {
      method: 'GET',
      url: '',
      headers: [],
      body: '',
    },
  },
  {
    type: 'mcp-tool',
    label: 'MCP 工具',
    description: '调用 MCP Protocol 工具',
    category: '集成',
    icon: '🧰',
    defaultConfig: {
      toolId: '',
      params: {},
    },
  },
  {
    type: 'subworkflow',
    label: '子工作流',
    description: '调用已有工作流，映射输入输出',
    category: '集成',
    icon: '🕸️',
    defaultConfig: {
      workflowId: '',
      inputMappings: [],
    },
  },
  {
    type: 'file-selector',
    label: '文件选择器',
    description: '打开系统文件选择对话框',
    category: '文件操作',
    icon: '🗂️',
    defaultConfig: {
      mode: 'single',
      filters: [],
    },
  },
  {
    type: 'file-operation',
    label: '文件操作',
    description: '复制/移动/删除文件',
    category: '文件操作',
    icon: '📁',
    defaultConfig: {
      action: 'copy',
      source: '',
      target: '',
    },
  },
  {
    type: 'clipboard',
    label: '剪贴板',
    description: '读写剪贴板',
    category: '系统操作',
    icon: '📋',
    defaultConfig: {
      action: 'read',
      format: 'text',
    },
  },
  {
    type: 'shell-command',
    label: 'Shell 命令',
    description: '执行系统命令并获取输出',
    category: '系统操作',
    icon: '💻',
    defaultConfig: {
      command: '',
      cwd: '',
      env: {},
    },
  },
  {
    type: 'app-control',
    label: '应用控制',
    description: '启动/退出/激活应用',
    category: '系统操作',
    icon: '🪟',
    defaultConfig: {
      action: 'launch',
      bundleId: '',
    },
  },
  {
    type: 'datetime',
    label: '日期时间',
    description: '获取/格式化日期时间',
    category: '时间操作',
    icon: '📅',
    defaultConfig: {
      action: 'now',
      format: 'YYYY-MM-DD HH:mm:ss',
    },
  },
  {
    type: 'ai-process',
    label: 'AI 处理',
    description: '文本生成/提取/翻译',
    category: 'AI操作',
    icon: '🤖',
    defaultConfig: {
      model: 'gpt-4o-mini',
      prompt: '',
    },
  },
  {
    type: 'ai-call',
    label: 'AI 通话',
    description: '配置 ASR/TTS 的实时对话',
    category: 'AI操作',
    icon: '🎧',
    defaultConfig: {
      language: 'zh-CN',
      tone: 'default',
    },
  },
  {
    type: 'notification',
    label: '通知发送',
    description: '发送系统/IM 通知',
    category: '通知',
    icon: '🔔',
    defaultConfig: {
      channel: 'system',
      target: '',
      message: '',
    },
  },
  {
    type: 'agent-call',
    label: 'Agent 调用',
    description: '调度 Agent 完成子任务',
    category: 'Agent调用',
    icon: '🧠',
    defaultConfig: {
      agentId: '',
      instructions: '',
    },
  },
];

export const NODE_CATEGORY_ORDER: NodeCategory[] = [
  'UI自动化',
  '流程控制',
  '集成',
  '文件操作',
  '系统操作',
  '时间操作',
  'AI操作',
  '通知',
  'Agent调用',
];

export const buildNodeInstance = (
  definition: NodeDefinition,
  position: { x: number; y: number },
): INode => ({
  id: `node-${Date.now().toString(36)}-${Math.round(Math.random() * 9999)}`,
  type: definition.type,
  label: definition.label,
  config: definition.defaultConfig,
  position,
});
