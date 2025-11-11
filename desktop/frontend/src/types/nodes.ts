// 节点定义和配置

import { NodeType } from './index';

export interface NodeDefinition {
  type: NodeType;
  category: NodeCategory;
  label: string;
  icon: string;
  description: string;
  defaultConfig: Record<string, any>;
  configSchema: ConfigField[];
}

export type NodeCategory =
  | 'ui_automation'
  | 'flow_control'
  | 'integration'
  | 'file_operation'
  | 'system_operation'
  | 'ai_operation';

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'locator';
  required?: boolean;
  default?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
}

// 节点库定义
export const NODE_DEFINITIONS: NodeDefinition[] = [
  // UI自动化节点
  {
    type: 'click',
    category: 'ui_automation',
    label: 'Click',
    icon: '📍',
    description: '点击元素',
    defaultConfig: {
      clickType: 'single',
      waitAfter: 1000,
    },
    configSchema: [
      {
        name: 'clickType',
        label: '点击类型',
        type: 'select',
        required: true,
        default: 'single',
        options: [
          { label: '单击', value: 'single' },
          { label: '双击', value: 'double' },
          { label: '右键', value: 'right' },
        ],
      },
      {
        name: 'waitAfter',
        label: '等待时间(ms)',
        type: 'number',
        default: 1000,
      },
    ],
  },
  {
    type: 'input',
    category: 'ui_automation',
    label: 'Input',
    icon: '⌨️',
    description: '输入文本',
    defaultConfig: {
      text: '',
      clearBefore: true,
    },
    configSchema: [
      {
        name: 'text',
        label: '输入内容',
        type: 'textarea',
        required: true,
        placeholder: '请输入文本内容',
      },
      {
        name: 'clearBefore',
        label: '输入前清空',
        type: 'checkbox',
        default: true,
      },
    ],
  },
  {
    type: 'drag_drop',
    category: 'ui_automation',
    label: 'Drag & Drop',
    icon: '🖱️',
    description: '拖拽元素',
    defaultConfig: {},
    configSchema: [],
  },
  {
    type: 'scroll',
    category: 'ui_automation',
    label: 'Scroll',
    icon: '📜',
    description: '滚动页面',
    defaultConfig: {
      direction: 'down',
      amount: 100,
    },
    configSchema: [
      {
        name: 'direction',
        label: '滚动方向',
        type: 'select',
        options: [
          { label: '向下', value: 'down' },
          { label: '向上', value: 'up' },
        ],
      },
      {
        name: 'amount',
        label: '滚动距离',
        type: 'number',
        default: 100,
      },
    ],
  },
  {
    type: 'hover',
    category: 'ui_automation',
    label: 'Hover',
    icon: '👆',
    description: '鼠标悬停',
    defaultConfig: {
      duration: 1000,
    },
    configSchema: [
      {
        name: 'duration',
        label: '悬停时长(ms)',
        type: 'number',
        default: 1000,
      },
    ],
  },
  {
    type: 'keyboard',
    category: 'ui_automation',
    label: 'Keyboard',
    icon: '⌨️',
    description: '键盘按键',
    defaultConfig: {
      keys: '',
    },
    configSchema: [
      {
        name: 'keys',
        label: '按键组合',
        type: 'text',
        required: true,
        placeholder: '例如: ctrl+c, enter',
      },
    ],
  },
  {
    type: 'delay',
    category: 'ui_automation',
    label: 'Delay',
    icon: '⏱️',
    description: '延迟等待',
    defaultConfig: {
      duration: 1000,
    },
    configSchema: [
      {
        name: 'duration',
        label: '等待时长(ms)',
        type: 'number',
        required: true,
        default: 1000,
      },
    ],
  },
  // 流程控制节点
  {
    type: 'variable',
    category: 'flow_control',
    label: 'Variable',
    icon: '📦',
    description: '变量操作',
    defaultConfig: {
      operation: 'set',
      name: '',
      value: '',
    },
    configSchema: [
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        options: [
          { label: '设置', value: 'set' },
          { label: '获取', value: 'get' },
          { label: '删除', value: 'delete' },
        ],
      },
      {
        name: 'name',
        label: '变量名',
        type: 'text',
        required: true,
      },
      {
        name: 'value',
        label: '变量值',
        type: 'text',
      },
    ],
  },
  {
    type: 'compare',
    category: 'flow_control',
    label: 'Compare',
    icon: '🔀',
    description: '条件比较',
    defaultConfig: {
      left: '',
      operator: '==',
      right: '',
    },
    configSchema: [
      {
        name: 'left',
        label: '左值',
        type: 'text',
        required: true,
      },
      {
        name: 'operator',
        label: '运算符',
        type: 'select',
        options: [
          { label: '等于', value: '==' },
          { label: '不等于', value: '!=' },
          { label: '大于', value: '>' },
          { label: '小于', value: '<' },
          { label: '包含', value: 'contains' },
        ],
      },
      {
        name: 'right',
        label: '右值',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    type: 'data_extract',
    category: 'flow_control',
    label: 'Data Extract',
    icon: '📊',
    description: '数据提取',
    defaultConfig: {
      source: '',
      pattern: '',
    },
    configSchema: [
      {
        name: 'source',
        label: '数据源',
        type: 'text',
        required: true,
      },
      {
        name: 'pattern',
        label: '提取模式',
        type: 'text',
        placeholder: '正则表达式或JSON路径',
      },
    ],
  },
  // 集成节点
  {
    type: 'http_request',
    category: 'integration',
    label: 'HTTP Request',
    icon: '🌐',
    description: 'HTTP请求',
    defaultConfig: {
      method: 'GET',
      url: '',
      headers: {},
      body: '',
    },
    configSchema: [
      {
        name: 'method',
        label: '请求方法',
        type: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        name: 'url',
        label: 'URL',
        type: 'text',
        required: true,
        placeholder: 'https://api.example.com/data',
      },
      {
        name: 'body',
        label: '请求体',
        type: 'textarea',
        placeholder: 'JSON格式',
      },
    ],
  },
  {
    type: 'subworkflow',
    category: 'integration',
    label: 'Subworkflow',
    icon: '🔄',
    description: '子工作流',
    defaultConfig: {
      workflowId: '',
    },
    configSchema: [
      {
        name: 'workflowId',
        label: '工作流ID',
        type: 'text',
        required: true,
      },
    ],
  },
  // 文件操作节点
  {
    type: 'file_selector',
    category: 'file_operation',
    label: 'File Selector',
    icon: '📁',
    description: '文件选择',
    defaultConfig: {
      mode: 'open',
      filters: [],
    },
    configSchema: [
      {
        name: 'mode',
        label: '选择模式',
        type: 'select',
        options: [
          { label: '打开文件', value: 'open' },
          { label: '保存文件', value: 'save' },
          { label: '选择文件夹', value: 'folder' },
        ],
      },
    ],
  },
  {
    type: 'file_operation',
    category: 'file_operation',
    label: 'File Operation',
    icon: '📄',
    description: '文件操作',
    defaultConfig: {
      operation: 'read',
      path: '',
    },
    configSchema: [
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        options: [
          { label: '读取', value: 'read' },
          { label: '写入', value: 'write' },
          { label: '删除', value: 'delete' },
          { label: '复制', value: 'copy' },
          { label: '移动', value: 'move' },
        ],
      },
      {
        name: 'path',
        label: '文件路径',
        type: 'text',
        required: true,
      },
    ],
  },
  // 系统操作节点
  {
    type: 'clipboard',
    category: 'system_operation',
    label: 'Clipboard',
    icon: '📋',
    description: '剪贴板',
    defaultConfig: {
      operation: 'copy',
      content: '',
    },
    configSchema: [
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        options: [
          { label: '复制', value: 'copy' },
          { label: '粘贴', value: 'paste' },
          { label: '获取', value: 'get' },
        ],
      },
      {
        name: 'content',
        label: '内容',
        type: 'textarea',
      },
    ],
  },
  {
    type: 'shell_command',
    category: 'system_operation',
    label: 'Shell Command',
    icon: '💻',
    description: 'Shell命令',
    defaultConfig: {
      command: '',
      workingDir: '',
    },
    configSchema: [
      {
        name: 'command',
        label: '命令',
        type: 'text',
        required: true,
        placeholder: '例如: ls -la',
      },
      {
        name: 'workingDir',
        label: '工作目录',
        type: 'text',
      },
    ],
  },
  {
    type: 'app_control',
    category: 'system_operation',
    label: 'App Control',
    icon: '🖥️',
    description: '应用控制',
    defaultConfig: {
      operation: 'launch',
      appName: '',
    },
    configSchema: [
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        options: [
          { label: '启动', value: 'launch' },
          { label: '关闭', value: 'close' },
          { label: '激活', value: 'activate' },
        ],
      },
      {
        name: 'appName',
        label: '应用名称',
        type: 'text',
        required: true,
      },
    ],
  },
];

// 按分类组织节点
export const NODE_CATEGORIES = {
  ui_automation: {
    label: 'UI自动化',
    icon: '🖱️',
    nodes: NODE_DEFINITIONS.filter((n) => n.category === 'ui_automation'),
  },
  flow_control: {
    label: '流程控制',
    icon: '🔀',
    nodes: NODE_DEFINITIONS.filter((n) => n.category === 'flow_control'),
  },
  integration: {
    label: '集成',
    icon: '🔗',
    nodes: NODE_DEFINITIONS.filter((n) => n.category === 'integration'),
  },
  file_operation: {
    label: '文件操作',
    icon: '📁',
    nodes: NODE_DEFINITIONS.filter((n) => n.category === 'file_operation'),
  },
  system_operation: {
    label: '系统操作',
    icon: '⚙️',
    nodes: NODE_DEFINITIONS.filter((n) => n.category === 'system_operation'),
  },
};
