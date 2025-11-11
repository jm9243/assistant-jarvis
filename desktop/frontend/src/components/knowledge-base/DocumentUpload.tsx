import { useState, useRef, DragEvent } from 'react';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  knowledgeBaseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUpload({ knowledgeBaseId, onClose, onSuccess }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // 检查文件类型
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.md')) {
        alert(`不支持的文件类型: ${file.name}`);
        continue;
      }

      // 检查文件大小 (最大50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`文件过大: ${file.name} (最大50MB)`);
        continue;
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        status: 'pending',
        progress: 0
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      onSuccess();
      return;
    }

    // 逐个上传文件
    for (const uploadFile of pendingFiles) {
      await uploadSingleFile(uploadFile);
    }

    // 检查是否全部成功
    const allSuccess = files.every(f => f.status === 'success');
    if (allSuccess) {
      onSuccess();
    }
  };

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    // 更新状态为上传中
    setFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress }
              : f
          ));
        }
      });

      // 上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          
          if (data.code === 0) {
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'success', progress: 100 }
                : f
            ));
          } else {
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'error', error: data.message || '上传失败' }
                : f
            ));
          }
        } else {
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: '上传失败' }
              : f
          ));
        }
      });

      // 上传错误
      xhr.addEventListener('error', () => {
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: '网络错误' }
            : f
        ));
      });

      // 发送请求
      xhr.open('POST', `http://localhost:8000/api/v1/knowledge-bases/${knowledgeBaseId}/documents`);
      xhr.send(formData);

    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'error', error: '上传失败' }
          : f
      ));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-jarvis-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'uploading':
        return <div className="loading-spinner w-5 h-5"></div>;
      default:
        return (
          <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const isUploading = files.some(f => f.status === 'uploading');
  const hasFiles = files.length > 0;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={!isUploading ? onClose : undefined}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-orbitron text-jarvis-gold">上传文档</h2>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {/* 拖拽上传区域 */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-jarvis-gold bg-jarvis-gold/10'
                  : 'border-jarvis-gold/30 hover:border-jarvis-gold/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <svg className="w-12 h-12 mx-auto mb-4 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <p className="text-jarvis-text mb-2">
                拖拽文件到这里，或
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                选择文件
              </button>

              <p className="text-xs text-jarvis-text-secondary mt-4">
                支持 PDF, Word, TXT, Markdown 格式，单个文件最大 50MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* 文件列表 */}
            {hasFiles && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-jarvis-text mb-3">
                  待上传文件 ({files.length})
                </h3>
                
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-jarvis-panel/40 border border-white/5 rounded-lg"
                  >
                    {/* 状态图标 */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-jarvis-text truncate">
                          {file.file.name}
                        </span>
                        <span className="text-xs text-jarvis-text-secondary ml-2">
                          {formatSize(file.file.size)}
                        </span>
                      </div>

                      {/* 进度条 */}
                      {file.status === 'uploading' && (
                        <div className="w-full h-1.5 bg-jarvis-panel/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-jarvis-gold to-jarvis-gold-dark rounded-full transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}

                      {/* 错误信息 */}
                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-jarvis-danger">{file.error}</p>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    {file.status === 'pending' && (
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="flex-shrink-0 p-1 hover:bg-jarvis-danger/20 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center gap-3 p-6 border-t border-white/5">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="btn-ghost flex-1"
            >
              {isUploading ? '上传中...' : '取消'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!hasFiles || isUploading}
              className="btn-primary flex-1"
            >
              {isUploading ? '上传中...' : `上传 (${files.filter(f => f.status === 'pending').length})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
