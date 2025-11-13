/**
 * 服务层统一导出
 * 
 * 提供所有服务的统一入口
 */

// Python引擎服务
export { pythonEngine, PythonEngineService } from './python';

// Go后台服务
export { backend, BackendService } from './backend';

// 类型定义
export * from './types';

// 错误处理
export {
    convertTauriError,
    convertHttpError,
    ErrorLogger,
    ErrorLogLevel,
    showErrorNotification,
    setErrorNotificationHandler,
    withRetry,
    handleErrors,
} from './errorHandler';

// 从types导出错误类型
export { ServiceError, ServiceErrorType } from './types';

export type {
    ErrorNotificationConfig,
    RetryConfig,
    ErrorHandlerDecoratorConfig,
} from './errorHandler';

// 导入服务实例用于默认导出
import { pythonEngine } from './python';
import { backend } from './backend';

// 默认导出
export default {
    pythonEngine,
    backend,
};
