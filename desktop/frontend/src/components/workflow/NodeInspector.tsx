import { useState, useEffect } from 'react';
import { INode } from '@/types';
import { NODE_DEFINITIONS, ConfigField } from '@/types/nodes';

interface NodeInspectorProps {
  node: INode | null;
  onUpdate: (nodeId: string, updates: Partial<INode>) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeInspector({ node, onUpdate, onDelete }: NodeInspectorProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setLocalConfig(node.data.config || {});
    }
  }, [node]);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-jarvis-text-secondary">
          <div className="text-4xl mb-2">👈</div>
          <div className="text-sm">选择一个节点以配置</div>
        </div>
      </div>
    );
  }

  const nodeDefinition = NODE_DEFINITIONS.find((def) => def.type === node.type);

  if (!nodeDefinition) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-jarvis-danger">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm">未知节点类型</div>
        </div>
      </div>
    );
  }

  const handleConfigChange = (fieldName: string, value: any) => {
    const newConfig = { ...localConfig, [fieldName]: value };
    setLocalConfig(newConfig);
    onUpdate(node.id, {
      data: {
        ...node.data,
        config: newConfig,
      },
    });
  };

  const handleLabelChange = (label: string) => {
    onUpdate(node.id, {
      data: {
        ...node.data,
        label,
      },
    });
  };

  const handleDescriptionChange = (description: string) => {
    onUpdate(node.id, {
      data: {
        ...node.data,
        description,
      },
    });
  };

  const renderConfigField = (field: ConfigField) => {
    const value = localConfig[field.name] ?? field.default;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleConfigChange(field.name, Number(e.target.value))}
            className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary resize-none"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleConfigChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-jarvis-panel text-jarvis-primary focus:ring-jarvis-primary focus:ring-offset-0"
            />
            <span className="text-sm text-jarvis-text">{field.label}</span>
          </label>
        );

      case 'locator':
        return (
          <div className="space-y-2">
            <button className="w-full px-3 py-2 bg-jarvis-primary/20 hover:bg-jarvis-primary/30 border border-jarvis-primary/50 rounded-lg text-sm text-jarvis-primary transition-colors">
              🎯 选择元素
            </button>
            {value && (
              <div className="text-xs text-jarvis-text-secondary p-2 bg-jarvis-panel/50 rounded">
                已选择元素
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{nodeDefinition.icon}</span>
            <span className="text-sm font-medium text-jarvis-text">{nodeDefinition.label}</span>
          </div>
          <button
            onClick={() => onDelete(node.id)}
            className="p-2 text-jarvis-danger hover:bg-jarvis-danger/10 rounded-lg transition-colors"
            title="删除节点"
          >
            🗑️
          </button>
        </div>
        <div className="text-xs text-jarvis-text-secondary">{nodeDefinition.description}</div>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 基础信息 */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-jarvis-text-secondary uppercase">基础信息</div>

          <div>
            <label className="block text-sm text-jarvis-text mb-1">节点名称</label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-jarvis-text mb-1">描述</label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary resize-none"
              placeholder="可选的节点描述"
            />
          </div>
        </div>

        {/* 节点配置 */}
        {nodeDefinition.configSchema.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-jarvis-text-secondary uppercase">节点配置</div>

            {nodeDefinition.configSchema.map((field) => (
              <div key={field.name}>
                <label className="block text-sm text-jarvis-text mb-1">
                  {field.label}
                  {field.required && <span className="text-jarvis-danger ml-1">*</span>}
                </label>
                {renderConfigField(field)}
                {field.description && (
                  <div className="text-xs text-jarvis-text-secondary mt-1">{field.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 元素定位 */}
        {['click', 'input', 'hover'].includes(node.type) && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-jarvis-text-secondary uppercase">元素定位</div>
            <button className="w-full px-4 py-3 bg-jarvis-primary/20 hover:bg-jarvis-primary/30 border border-jarvis-primary/50 rounded-lg text-sm text-jarvis-primary transition-colors">
              🎯 配置定位策略
            </button>
            <div className="text-xs text-jarvis-text-secondary">
              支持 AXUI、OCR、图像匹配、坐标定位
            </div>
          </div>
        )}

        {/* 错误处理 */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-jarvis-text-secondary uppercase">错误处理</div>

          <div>
            <label className="block text-sm text-jarvis-text mb-1">失败策略</label>
            <select
              value={localConfig.errorStrategy || 'stop'}
              onChange={(e) => handleConfigChange('errorStrategy', e.target.value)}
              className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
            >
              <option value="stop">停止工作流</option>
              <option value="continue">继续执行</option>
              <option value="retry">重试</option>
            </select>
          </div>

          {localConfig.errorStrategy === 'retry' && (
            <div>
              <label className="block text-sm text-jarvis-text mb-1">重试次数</label>
              <input
                type="number"
                value={localConfig.retryCount || 3}
                onChange={(e) => handleConfigChange('retryCount', Number(e.target.value))}
                min={1}
                max={10}
                className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
              />
            </div>
          )}
        </div>

        {/* 节点信息 */}
        <div className="pt-4 border-t border-white/5">
          <div className="text-xs text-jarvis-text-secondary space-y-1">
            <div>节点 ID: {node.id}</div>
            <div>节点类型: {node.type}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
