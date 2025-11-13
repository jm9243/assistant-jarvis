import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export function RegisterPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 验证
        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (password.length < 8) {
            setError('密码长度至少为8位');
            return;
        }

        if (!email.includes('@')) {
            setError('请输入有效的邮箱地址');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                email,
                password,
            });

            if (response.data.code === 0) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.data.message || '注册失败');
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data?.message || '注册失败，请稍后重试');
            } else {
                setError('注册失败，请稍后重试');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-jarvis-space">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-jarvis-success/20 rounded-full animate-pulse" />
                        <div className="absolute inset-4 bg-jarvis-success/40 rounded-full animate-pulse delay-300" />
                        <div className="absolute inset-8 bg-jarvis-success rounded-full flex items-center justify-center">
                            <span className="text-3xl">✓</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-orbitron font-bold text-jarvis-text mb-2">注册成功！</h2>
                    <p className="text-jarvis-text-secondary">正在跳转到登录页面...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden">
            {/* 左侧品牌展示区 */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-jarvis-space to-jarvis-space-light overflow-hidden">
                {/* 动态背景 */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-jarvis-gold/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jarvis-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                {/* 中心内容 */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
                    {/* Logo/3D动画占位 */}
                    <div className="w-48 h-48 mb-8 relative">
                        <div className="absolute inset-0 bg-jarvis-gold/20 rounded-full animate-pulse-gold" />
                        <div className="absolute inset-4 bg-jarvis-gold/40 rounded-full animate-pulse-gold delay-300" />
                        <div className="absolute inset-8 bg-jarvis-gold rounded-full flex items-center justify-center">
                            <span className="text-4xl">🟡</span>
                        </div>
                    </div>

                    {/* 品牌信息 */}
                    <h1 className="text-4xl font-orbitron font-bold text-jarvis-gold mb-2">助手·贾维斯</h1>
                    <p className="text-xl font-orbitron text-jarvis-text-secondary mb-4">JARVIS AI ASSISTANT</p>
                    <p className="text-sm text-jarvis-text-secondary text-center max-w-md">
                        Join the Future of AI Assistance
                    </p>

                    {/* 版本号 */}
                    <div className="absolute bottom-8 left-8 text-xs text-jarvis-text-secondary">v1.0.0</div>
                </div>
            </div>

            {/* 右侧注册表单 */}
            <div className="flex-1 flex items-center justify-center p-8 bg-jarvis-space-light">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-3xl font-orbitron font-bold text-jarvis-text mb-2">加入贾维斯</h2>
                        <p className="text-jarvis-text-secondary">创建您的账号，开启AI助手之旅</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 用户名输入 */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-jarvis-text mb-2">
                                👤 用户名
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input w-full"
                                placeholder="请输入用户名"
                                required
                                autoFocus
                                minLength={3}
                            />
                            <p className="mt-1 text-xs text-jarvis-text-secondary">至少3个字符</p>
                        </div>

                        {/* 邮箱输入 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-jarvis-text mb-2">
                                📧 邮箱
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input w-full"
                                placeholder="请输入邮箱地址"
                                required
                            />
                            <p className="mt-1 text-xs text-jarvis-text-secondary">请使用真实邮箱，用于账号验证</p>
                        </div>

                        {/* 密码输入 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-jarvis-text mb-2">
                                🔒 密码
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input w-full pr-10"
                                    placeholder="请输入密码"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-jarvis-text-secondary hover:text-jarvis-text"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-jarvis-text-secondary">至少8个字符</p>
                        </div>

                        {/* 确认密码输入 */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-jarvis-text mb-2">
                                🔒 确认密码
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input w-full pr-10"
                                    placeholder="请再次输入密码"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-jarvis-text-secondary hover:text-jarvis-text"
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 bg-jarvis-danger/10 border border-jarvis-danger/20 rounded-lg text-jarvis-danger text-sm">
                                {error}
                            </div>
                        )}

                        {/* 注册按钮 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn('btn-primary w-full', isLoading && 'opacity-50 cursor-not-allowed')}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading-spinner mr-2" />
                                    注册中...
                                </span>
                            ) : (
                                '创建账号 →'
                            )}
                        </button>

                        {/* 用户协议 */}
                        <p className="text-xs text-jarvis-text-secondary text-center">
                            注册即表示您同意我们的
                            <button className="text-jarvis-gold hover:underline mx-1">服务条款</button>
                            和
                            <button className="text-jarvis-gold hover:underline ml-1">隐私政策</button>
                        </p>
                    </form>

                    {/* 登录链接 */}
                    <div className="mt-6 text-center text-sm text-jarvis-text-secondary">
                        已有账号？
                        <button
                            className="ml-1 text-jarvis-gold hover:underline"
                            onClick={() => navigate('/login')}
                        >
                            立即登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
