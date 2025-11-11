/**
 * Toast测试工具
 * 用于在开发时测试Toast功能
 * 
 * 使用方法：
 * 在浏览器控制台中运行：
 * import { testToast } from '@/utils/testToast';
 * testToast.all();
 */

import { toast } from '@/components/ui/Toast';

export const testToast = {
    // 测试成功提示
    success() {
        toast.success('操作成功', '数据已成功保存到数据库');
    },

    // 测试错误提示
    error() {
        toast.error('连接失败', '无法连接到本地引擎，请检查服务是否正常运行');
    },

    // 测试警告提示
    warning() {
        toast.warning('注意', '此操作将删除所有数据，且不可恢复');
    },

    // 测试信息提示
    info() {
        toast.info('系统提示', '系统将在5分钟后进行维护');
    },

    // 测试带操作按钮的提示
    withAction() {
        toast.error('无法连接到本地引擎', '贾维斯的执行引擎未启动，部分功能将无法使用', {
            duration: 0,
            action: {
                label: '查看解决方案',
                onClick: () => {
                    console.log('用户点击了查看解决方案');
                    toast.info('启动引擎指南', '请在终端运行: npm run start:engine');
                }
            }
        });
    },

    // 测试持久提示（不自动关闭）
    persistent() {
        toast.warning('重要提示', '这条消息不会自动关闭', {
            duration: 0
        });
    },

    // 测试所有类型
    all() {
        setTimeout(() => this.success(), 0);
        setTimeout(() => this.info(), 500);
        setTimeout(() => this.warning(), 1000);
        setTimeout(() => this.error(), 1500);
        setTimeout(() => this.withAction(), 2000);
    },

    // 测试连接错误场景
    connectionError() {
        // 模拟引擎连接失败
        toast.error(
            '无法连接到本地引擎',
            '贾维斯的执行引擎未启动，部分功能将无法使用',
            {
                duration: 0,
                action: {
                    label: '查看解决方案',
                    onClick: () => {
                        const helpMessage = `
请按以下步骤启动本地引擎：

1. 开发模式：
   在终端运行: npm run start:engine
   
2. 生产模式：
   引擎会自动启动，如果失败请检查：
   - 是否正确安装了Python依赖
   - 端口8000是否被占用
   - 查看日志文件: logs/engine.log

3. 需要帮助？
   查看文档: desktop/QUICK_REFERENCE.md
            `.trim();

                        toast.info('启动引擎指南', helpMessage, {
                            duration: 0,
                        });
                    },
                },
            }
        );

        // 模拟云服务连接失败
        setTimeout(() => {
            toast.warning(
                '无法连接到云服务',
                '云端功能暂时不可用，本地功能不受影响',
                {
                    duration: 8000,
                }
            );
        }, 1000);
    },

    // 测试连接恢复
    connectionRecovered() {
        toast.success('本地引擎已连接', '所有功能已恢复正常');

        setTimeout(() => {
            toast.success('云服务已连接', '云端功能已恢复');
        }, 500);
    }
};

// 在window对象上暴露测试函数（仅开发环境）
if ((import.meta as any).env?.DEV) {
    (window as any).testToast = testToast;
    console.log('Toast测试工具已加载，使用 window.testToast 进行测试');
    console.log('示例: window.testToast.all()');
}
