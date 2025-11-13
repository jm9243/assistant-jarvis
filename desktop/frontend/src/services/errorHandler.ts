/**
 * 错误处理模块
 * 
 * 提供统一的错误处理机制，包括：
 * - 错误分类和转换
 * - 用户友好的错误提示
 * - 错误日志记录
 * - 错误重试逻辑
 */
import { ServiceError, ServiceErrorType } from './types';

// ============================================================================
// 错误转换函数
// ============================================================================

/**
 * 将Tauri IPC错误转换为ServiceError
 * 
 * @param error - Tauri IPC调用返回的错误
 * @returns ServiceError实例
 */
export function convertTauriError(error: any): ServiceError {
    const errorMessage = typeof error === 'string' ? error : error?.message || '未知错误';

    // Python引擎未启动
    if (errorMessage.includes('Python process not started') ||
        errorMessage.includes('Engine not started')) {
        return new ServiceError(
            ServiceErrorType.ENGINE_NOT_STARTED,
            'Python引擎未启动',
            'ENGINE_NOT_STARTED',
            error
        );
    }

    // Python引擎崩溃
    if (errorMessage.includes('Process crashed') ||
        errorMessage.includes('Engine crashed')) {
        return new ServiceError(
            ServiceErrorType.ENGINE_CRASHED,
            'Python引擎崩溃',
            'ENGINE_CRASHED',
            error
        );
    }

    // IPC通信错误
    if (errorMessage.includes('IPC') ||
        errorMessage.includes('Failed to write to stdin') ||
        errorMessage.includes('Request timeout')) {
        return new ServiceError(
            ServiceErrorType.IPC_ERROR,
            '进程通信错误',
            'IPC_ERROR',
            error
        );
    }

    // 超时错误
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        return new ServiceError(
            ServiceErrorType.TIMEOUT,
            '请求超时',
            'TIMEOUT',
            error
        );
    }

    // 参数验证错误
    if (errorMessage.includes('cannot be empty') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
        return new ServiceError(
            ServiceErrorType.VALIDATION_ERROR,
            errorMessage,
            'VALIDATION_ERROR',
            error
        );
    }

    // 资源不存在
    if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return new ServiceError(
            ServiceErrorType.RESOURCE_NOT_FOUND,
            errorMessage,
            'RESOURCE_NOT_FOUND',
            error
        );
    }

    // 操作失败
    if (errorMessage.includes('failed') || errorMessage.includes('Failed')) {
        return new ServiceError(
            ServiceErrorType.OPERATION_FAILED,
            errorMessage,
            'OPERATION_FAILED',
            error
        );
    }

    // 默认未知错误
    return new ServiceError(
        ServiceErrorType.UNKNOWN_ERROR,
        errorMessage,
        'UNKNOWN_ERROR',
        error
    );
}

/**
 * 将HTTP错误转换为ServiceError
 * 
 * @param error - Axios错误对象
 * @returns ServiceError实例
 */
export function convertHttpError(error: any): ServiceError {
    // 网络连接错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return new ServiceError(
            ServiceErrorType.CONNECTION_REFUSED,
            '无法连接到服务器',
            error.code,
            error
        );
    }

    // 超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return new ServiceError(
            ServiceErrorType.TIMEOUT,
            '请求超时',
            'TIMEOUT',
            error
        );
    }

    // HTTP状态码错误
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
            case 400:
                return new ServiceError(
                    ServiceErrorType.BAD_REQUEST,
                    data?.error || '请求参数错误',
                    data?.error_code || 'BAD_REQUEST',
                    error
                );

            case 401:
                return new ServiceError(
                    ServiceErrorType.UNAUTHORIZED,
                    data?.error || '未授权，请重新登录',
                    data?.error_code || 'UNAUTHORIZED',
                    error
                );

            case 403:
                return new ServiceError(
                    ServiceErrorType.FORBIDDEN,
                    data?.error || '没有权限访问',
                    data?.error_code || 'FORBIDDEN',
                    error
                );

            case 404:
                return new ServiceError(
                    ServiceErrorType.NOT_FOUND,
                    data?.error || '请求的资源不存在',
                    data?.error_code || 'NOT_FOUND',
                    error
                );

            case 422:
                return new ServiceError(
                    ServiceErrorType.VALIDATION_ERROR,
                    data?.error || '数据验证失败',
                    data?.error_code || 'VALIDATION_ERROR',
                    error
                );

            case 429:
                return new ServiceError(
                    ServiceErrorType.QUOTA_EXCEEDED,
                    data?.error || '请求过于频繁或已超出配额',
                    data?.error_code || 'QUOTA_EXCEEDED',
                    error
                );

            case 500:
                return new ServiceError(
                    ServiceErrorType.INTERNAL_SERVER_ERROR,
                    data?.error || '服务器内部错误',
                    data?.error_code || 'INTERNAL_SERVER_ERROR',
                    error
                );

            case 503:
                return new ServiceError(
                    ServiceErrorType.SERVICE_UNAVAILABLE,
                    data?.error || '服务暂时不可用',
                    data?.error_code || 'SERVICE_UNAVAILABLE',
                    error
                );

            default:
                return new ServiceError(
                    ServiceErrorType.UNKNOWN_ERROR,
                    data?.error || `请求失败 (${status})`,
                    data?.error_code || 'UNKNOWN_ERROR',
                    error
                );
        }
    }

    // 默认网络错误
    return new ServiceError(
        ServiceErrorType.NETWORK_ERROR,
        error.message || '网络错误',
        'NETWORK_ERROR',
        error
    );
}

// ============================================================================
// 错误日志记录
// ============================================================================

/**
 * 错误日志级别
 */
export enum ErrorLogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
}

/**
 * 错误日志记录器
 */
export class ErrorLogger {
    private static logs: Array<{
        timestamp: string;
        level: ErrorLogLevel;
        error: ServiceError;
        context?: any;
    }> = [];

    private static maxLogs = 1000; // 最多保存1000条日志

    /**
     * 记录错误日志
     * 
     * @param error - ServiceError实例
     * @param level - 日志级别
     * @param context - 额外的上下文信息
     */
    static log(
        error: ServiceError,
        level: ErrorLogLevel = ErrorLogLevel.ERROR,
        context?: any
    ): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            error,
            context,
        };

        // 添加到日志数组
        this.logs.push(logEntry);

        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 控制台输出
        const consoleMethod = this.getConsoleMethod(level);
        consoleMethod(
            `[${logEntry.timestamp}] [${level.toUpperCase()}]`,
            error.message,
            error.type,
            context
        );

        // 可以在这里添加发送到远程日志服务的逻辑
        // this.sendToRemoteLogger(logEntry);
    }

    /**
     * 获取控制台输出方法
     */
    private static getConsoleMethod(level: ErrorLogLevel): (...args: any[]) => void {
        switch (level) {
            case ErrorLogLevel.DEBUG:
                return console.debug;
            case ErrorLogLevel.INFO:
                return console.info;
            case ErrorLogLevel.WARNING:
                return console.warn;
            case ErrorLogLevel.ERROR:
            case ErrorLogLevel.CRITICAL:
                return console.error;
            default:
                return console.log;
        }
    }

    /**
     * 获取所有日志
     */
    static getLogs(): typeof ErrorLogger.logs {
        return [...this.logs];
    }

    /**
     * 清空日志
     */
    static clearLogs(): void {
        this.logs = [];
    }

    /**
     * 导出日志为JSON
     */
    static exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

// ============================================================================
// 错误提示显示
// ============================================================================

/**
 * 错误提示配置
 */
export interface ErrorNotificationConfig {
    title?: string;
    message: string;
    duration?: number; // 显示时长（毫秒），0表示不自动关闭
    type?: 'error' | 'warning' | 'info';
    showRetry?: boolean;
    onRetry?: () => void;
}

/**
 * 错误提示处理器（需要在应用中实现）
 */
let notificationHandler: ((config: ErrorNotificationConfig) => void) | null = null;

/**
 * 设置错误提示处理器
 * 
 * @param handler - 提示处理函数
 * 
 * @example
 * ```typescript
 * import { setErrorNotificationHandler } from '@/services/errorHandler';
 * import { toast } from '@/components/ui/Toast';
 * 
 * setErrorNotificationHandler((config) => {
 *   toast.error(config.message, { duration: config.duration });
 * });
 * ```
 */
export function setErrorNotificationHandler(
    handler: (config: ErrorNotificationConfig) => void
): void {
    notificationHandler = handler;
}

/**
 * 显示错误提示
 * 
 * @param error - ServiceError实例
 * @param options - 额外的提示选项
 */
export function showErrorNotification(
    error: ServiceError,
    options?: Partial<ErrorNotificationConfig>
): void {
    if (!notificationHandler) {
        console.warn('Error notification handler not set');
        return;
    }

    const config: ErrorNotificationConfig = {
        title: '错误',
        message: error.getUserMessage(),
        duration: 5000,
        type: 'error',
        ...options,
    };

    notificationHandler(config);
}

// ============================================================================
// 错误重试逻辑
// ============================================================================

/**
 * 重试配置
 */
export interface RetryConfig {
    maxRetries: number; // 最大重试次数
    retryDelay: number; // 重试延迟（毫秒）
    backoffMultiplier?: number; // 退避倍数（指数退避）
    retryableErrors?: ServiceErrorType[]; // 可重试的错误类型
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: [
        ServiceErrorType.NETWORK_ERROR,
        ServiceErrorType.CONNECTION_REFUSED,
        ServiceErrorType.TIMEOUT,
        ServiceErrorType.SERVICE_UNAVAILABLE,
        ServiceErrorType.ENGINE_CRASHED,
    ],
};

/**
 * 判断错误是否可重试
 * 
 * @param error - ServiceError实例
 * @param config - 重试配置
 * @returns 是否可重试
 */
function isRetryableError(error: ServiceError, config: RetryConfig): boolean {
    if (!config.retryableErrors) {
        return false;
    }
    return config.retryableErrors.includes(error.type);
}

/**
 * 延迟函数
 * 
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带重试的异步函数执行
 * 
 * @param fn - 要执行的异步函数
 * @param config - 重试配置
 * @returns 函数执行结果
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => pythonEngine.agentChat('conv_123', 'Hello'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: ServiceError | null = null;
    let currentDelay = finalConfig.retryDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            // 转换为ServiceError
            const serviceError = error instanceof ServiceError
                ? error
                : convertTauriError(error);

            lastError = serviceError;

            // 记录错误日志
            ErrorLogger.log(
                serviceError,
                ErrorLogLevel.WARNING,
                { attempt, maxRetries: finalConfig.maxRetries }
            );

            // 如果是最后一次尝试或错误不可重试，直接抛出
            if (attempt === finalConfig.maxRetries || !isRetryableError(serviceError, finalConfig)) {
                throw serviceError;
            }

            // 等待后重试
            await delay(currentDelay);

            // 指数退避
            if (finalConfig.backoffMultiplier) {
                currentDelay *= finalConfig.backoffMultiplier;
            }
        }
    }

    // 理论上不会到达这里，但为了类型安全
    throw lastError || new ServiceError(
        ServiceErrorType.UNKNOWN_ERROR,
        '重试失败',
        'RETRY_FAILED'
    );
}

// ============================================================================
// 错误处理装饰器
// ============================================================================

/**
 * 错误处理装饰器配置
 */
export interface ErrorHandlerDecoratorConfig {
    showNotification?: boolean;
    logError?: boolean;
    retry?: Partial<RetryConfig>;
    fallbackValue?: any;
}

/**
 * 错误处理装饰器
 * 
 * 为异步方法添加统一的错误处理
 * 
 * @param config - 装饰器配置
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * class MyService {
 *   @handleErrors({ showNotification: true, retry: { maxRetries: 3 } })
 *   async fetchData() {
 *     // ...
 *   }
 * }
 * ```
 */
export function handleErrors(config: ErrorHandlerDecoratorConfig = {}) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                // 如果配置了重试，使用withRetry
                if (config.retry) {
                    return await withRetry(
                        () => originalMethod.apply(this, args),
                        config.retry
                    );
                } else {
                    return await originalMethod.apply(this, args);
                }
            } catch (error: any) {
                // 转换为ServiceError
                const serviceError = error instanceof ServiceError
                    ? error
                    : convertTauriError(error);

                // 记录错误日志
                if (config.logError !== false) {
                    ErrorLogger.log(serviceError, ErrorLogLevel.ERROR);
                }

                // 显示错误提示
                if (config.showNotification) {
                    showErrorNotification(serviceError);
                }

                // 如果有fallback值，返回它
                if (config.fallbackValue !== undefined) {
                    return config.fallbackValue;
                }

                // 否则重新抛出错误
                throw serviceError;
            }
        };

        return descriptor;
    };
}

// ============================================================================
// 导出（已在函数定义处使用export关键字，无需重复导出）
// ============================================================================
