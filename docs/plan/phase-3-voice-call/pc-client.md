# Phase 3: 语音通话 - PC端迭代计划

**阶段目标**: 实现AI智能接听电话功能  
**预计时间**: 2个月  
**依赖**: Phase 1 工作流系统、Phase 2 三种Agent完成

**架构说明**: 
- 本阶段基于已实现的架构：Python常驻进程 + Tauri IPC通信
- 通话功能作为Python引擎的扩展模块实现
- 前端通过Tauri IPC调用通话相关功能

---

## 目录

1. [功能清单](#功能清单)
2. [核心功能详解](#核心功能详解)
3. [技术架构](#技术架构)
4. [开发计划](#开发计划)
5. [验收标准](#验收标准)

---

## 功能清单

### 必须完成的功能模块

#### 1. AI智能接听 (对应PRD 4.7.1)
- [ ] 来电检测（通知监听）
- [ ] 来电人识别
- [ ] 自动接听配置
- [ ] 接听规则配置
- [ ] 阿里云智能媒体服务集成
- [ ] ASR（语音识别）
- [ ] TTS（语音合成）
- [ ] 对话管理
- [ ] 虚拟音频设备
- [ ] 音频接管技术
- [ ] 通话记录

#### 2. 音频设备管理 (对应PRD 4.7.2)
- [ ] 设备检测（列出所有音频设备）
- [ ] 虚拟设备检测
- [ ] 设备状态显示
- [ ] 设备配置选择
- [ ] 自动切换设备

#### 3. 音频测试 (对应PRD 4.7.3)
- [ ] 虚拟音频测试（播放、录制、回环）
- [ ] 阿里云服务测试（Token、ASR、TTS、AI Agent）

#### 4. 通话统计 (对应PRD 4.7.4)
- [ ] 今日通话数统计
- [ ] 总通话时长
- [ ] 平均通话时长
- [ ] 接通率统计
- [ ] 通话历史查看

---

## 核心功能详解

### 1. AI智能接听

#### 1.1 来电检测

**功能描述**: 监听系统和应用的来电通知

**技术实现**:

**Windows通知监听**:
```python
from winrt.windows.ui.notifications.management import UserNotificationListener
from winrt.windows.ui.notifications import NotificationKinds

class CallDetector:
    def __init__(self):
        self.listener = UserNotificationListener.get_current()
        
    async def start_monitoring(self):
        # 请求访问权限
        access = await self.listener.request_access_async()
        if access != UserNotificationListenerAccessStatus.ALLOWED:
            raise Exception("无法访问通知")
        
        # 监听通知
        while True:
            notifications = await self.listener.get_notifications_async(
                NotificationKinds.TOAST
            )
            
            for notification in notifications:
                # 检查是否为通话通知
                if self.is_call_notification(notification):
                    caller_info = self.extract_caller_info(notification)
                    await self.handle_incoming_call(caller_info)
            
            await asyncio.sleep(1)
    
    def is_call_notification(self, notification):
        # 检查通知来源和内容
        app_id = notification.app_info.display_info.display_name
        
        # 支持的应用
        call_apps = ["微信", "WeChat", "企业微信", "钉钉", "DingTalk"]
        
        if app_id in call_apps:
            # 检查通知内容是否包含来电关键词
            content = notification.notification.content
            keywords = ["语音通话", "视频通话", "来电", "Incoming Call"]
            return any(keyword in content for keyword in keywords)
        
        return False
```

**macOS通知监听**:
```python
from Foundation import NSObject, NSUserNotificationCenter, NSUserNotification
from PyObjCTools import AppHelper

class CallDetector(NSObject):
    def init(self):
        self = objc.super(CallDetector, self).init()
        if self is None:
            return None
        
        self.center = NSUserNotificationCenter.defaultUserNotificationCenter()
        self.center.setDelegate_(self)
        return self
    
    def userNotificationCenter_didDeliverNotification_(self, center, notification):
        # 检查是否为通话通知
        title = notification.title()
        subtitle = notification.subtitle()
        informative_text = notification.informativeText()
        
        # 微信、企业微信、钉钉等应用的通知特征
        if self.is_call_notification(title, subtitle, informative_text):
            caller_info = self.extract_caller_info(title, subtitle)
            self.handle_incoming_call(caller_info)
```

---

#### 1.2 自动接听配置

**功能描述**: 配置自动接听规则

**配置界面**:
- 开启/关闭自动接听
- 接听规则列表
- 添加/编辑/删除规则

**规则配置**:
```typescript
interface CallAnswerRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  
  // 匹配条件
  conditions: {
    // 时间条件
    timeRange?: {
      start: string; // "09:00"
      end: string;   // "18:00"
      weekdays: number[]; // [1,2,3,4,5]
    };
    
    // 联系人条件
    contacts?: {
      type: 'whitelist' | 'blacklist' | 'all' | 'unknown';
      list?: string[]; // 联系人名称列表
    };
    
    // 应用条件
    apps?: {
      type: 'include' | 'exclude';
      list: string[]; // ['微信', '企业微信']
    };
  };
  
  // 执行动作
  action: {
    answer: boolean; // 是否接听
    useAgent: boolean; // 是否使用AI Agent
    agentId?: string; // Agent ID
    greeting?: string; // 开场白
  };
}
```

**规则示例**:
```json
{
  "id": "rule_1",
  "name": "工作时间自动接听",
  "enabled": true,
  "priority": 1,
  "conditions": {
    "timeRange": {
      "start": "09:00",
      "end": "18:00",
      "weekdays": [1, 2, 3, 4, 5]
    },
    "apps": {
      "type": "include",
      "list": ["企业微信", "钉钉"]
    }
  },
  "action": {
    "answer": true,
    "useAgent": true,
    "agentId": "agent_customer_service",
    "greeting": "您好，我是AI助手，有什么可以帮助您的？"
  }
}
```

---

#### 1.3 虚拟音频设备集成

**功能描述**: 安装和管理虚拟音频设备驱动

**Windows虚拟音频 (VB-CABLE)**:

**安装流程**:
```python
import subprocess
import os

def install_vb_cable():
    # 检查是否已安装
    if is_vb_cable_installed():
        return True
    
    # VB-CABLE安装包路径（打包在应用中）
    installer_path = get_resource_path("drivers/VBCABLE_Setup_x64.exe")
    
    # 静默安装（需要管理员权限）
    try:
        # 请求管理员权限
        subprocess.run([
            "powershell",
            "-Command",
            f"Start-Process -FilePath '{installer_path}' -ArgumentList '/S' -Verb RunAs -Wait"
        ], check=True)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"安装失败: {e}")
        return False

def is_vb_cable_installed():
    # 检查虚拟设备是否存在
    import sounddevice as sd
    devices = sd.query_devices()
    
    for device in devices:
        if "CABLE Input" in device['name'] or "CABLE Output" in device['name']:
            return True
    
    return False
```

**macOS虚拟音频 (BlackHole)**:

**安装流程**:
```python
import subprocess

def install_blackhole():
    # 检查是否已安装
    if is_blackhole_installed():
        return True
    
    # BlackHole安装包路径
    installer_path = get_resource_path("drivers/BlackHole2ch.pkg")
    
    # 使用installer命令安装
    try:
        subprocess.run([
            "sudo",
            "installer",
            "-pkg", installer_path,
            "-target", "/"
        ], check=True)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"安装失败: {e}")
        return False

def is_blackhole_installed():
    import sounddevice as sd
    devices = sd.query_devices()
    
    for device in devices:
        if "BlackHole" in device['name']:
            return True
    
    return False
```

---

#### 1.4 音频接管技术实现

**功能描述**: 完整的音频重定向闭环

**音频切换管理器**:
```python
import sounddevice as sd
import subprocess
import platform

class AudioManager:
    def __init__(self):
        self.original_input = None
        self.original_output = None
        self.virtual_input = None
        self.virtual_output = None
        self.platform = platform.system()
        
    def initialize(self):
        # 保存当前设备
        self.original_input = self.get_default_input()
        self.original_output = self.get_default_output()
        
        # 检测虚拟设备
        self.virtual_input, self.virtual_output = self.detect_virtual_devices()
        
        if not self.virtual_input or not self.virtual_output:
            raise Exception("虚拟音频设备未安装")
    
    def detect_virtual_devices(self):
        devices = sd.query_devices()
        virtual_input = None
        virtual_output = None
        
        for idx, device in enumerate(devices):
            name = device['name']
            
            if self.platform == "Windows":
                if "CABLE Input" in name and device['max_input_channels'] > 0:
                    virtual_input = idx
                if "CABLE Output" in name and device['max_output_channels'] > 0:
                    virtual_output = idx
                    
            elif self.platform == "Darwin":  # macOS
                if "BlackHole" in name:
                    if device['max_input_channels'] > 0:
                        virtual_input = idx
                    if device['max_output_channels'] > 0:
                        virtual_output = idx
        
        return virtual_input, virtual_output
    
    def switch_to_virtual(self):
        """切换到虚拟设备"""
        if self.platform == "Windows":
            self._switch_windows_device(
                input_device=self.virtual_input,
                output_device=self.virtual_output
            )
        elif self.platform == "Darwin":
            self._switch_macos_device(
                input_device=self.virtual_input,
                output_device=self.virtual_output
            )
    
    def restore_original(self):
        """恢复原始设备"""
        if self.platform == "Windows":
            self._switch_windows_device(
                input_device=self.original_input,
                output_device=self.original_output
            )
        elif self.platform == "Darwin":
            self._switch_macos_device(
                input_device=self.original_input,
                output_device=self.original_output
            )
    
    def _switch_windows_device(self, input_device, output_device):
        # Windows使用nircmd或SetDefaultAudioPlaybackDevice
        try:
            # 切换输出设备
            subprocess.run([
                "nircmd",
                "setdefaultsounddevice",
                f"{output_device}"
            ], check=True)
            
            # 切换输入设备
            subprocess.run([
                "nircmd",
                "setdefaultsounddevice",
                f"{input_device}",
                "1"  # 1表示输入设备
            ], check=True)
        except Exception as e:
            print(f"切换设备失败: {e}")
    
    def _switch_macos_device(self, input_device, output_device):
        # macOS使用SwitchAudioSource
        try:
            devices = sd.query_devices()
            
            # 切换输出设备
            output_name = devices[output_device]['name']
            subprocess.run([
                "SwitchAudioSource",
                "-s", output_name
            ], check=True)
            
            # 切换输入设备
            input_name = devices[input_device]['name']
            subprocess.run([
                "SwitchAudioSource",
                "-s", input_name,
                "-t", "input"
            ], check=True)
        except Exception as e:
            print(f"切换设备失败: {e}")
```

---

#### 1.5 阿里云智能媒体服务集成

**功能描述**: 集成阿里云的ASR、TTS和AI Agent服务

**获取Token**:
```python
import requests
import json

class AliyunRTCService:
    def __init__(self, access_key_id, access_key_secret, app_key):
        self.access_key_id = access_key_id
        self.access_key_secret = access_key_secret
        self.app_key = app_key
        self.token_url = "https://nls-meta.cn-shanghai.aliyuncs.com/pop/2019-02-28/tokens"
    
    def get_token(self):
        """获取访问Token"""
        params = {
            "AccessKeyId": self.access_key_id,
            "Action": "CreateToken",
            "Version": "2019-02-28",
            "Format": "JSON"
        }
        
        # 添加签名
        signature = self._generate_signature(params)
        params["Signature"] = signature
        
        response = requests.get(self.token_url, params=params)
        result = response.json()
        
        if result.get("Token"):
            return result["Token"]["Id"]
        else:
            raise Exception(f"获取Token失败: {result}")
```

**ASR实时识别**:
```python
import websockets
import asyncio
import json

class ASRClient:
    def __init__(self, app_key, token):
        self.app_key = app_key
        self.token = token
        self.ws_url = f"wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1"
        self.ws = None
        
    async def connect(self):
        """建立WebSocket连接"""
        self.ws = await websockets.connect(self.ws_url)
        
        # 发送开始识别请求
        start_msg = {
            "header": {
                "message_id": self._generate_message_id(),
                "task_id": self._generate_task_id(),
                "namespace": "SpeechTranscriber",
                "name": "StartTranscription",
                "appkey": self.app_key
            },
            "payload": {
                "format": "pcm",
                "sample_rate": 16000,
                "enable_intermediate_result": True,
                "enable_punctuation_prediction": True,
                "enable_inverse_text_normalization": True
            }
        }
        
        await self.ws.send(json.dumps(start_msg))
    
    async def send_audio(self, audio_data):
        """发送音频数据"""
        if self.ws:
            await self.ws.send(audio_data)
    
    async def receive_results(self, callback):
        """接收识别结果"""
        try:
            async for message in self.ws:
                result = json.loads(message)
                
                # 处理不同类型的结果
                if result['header']['name'] == 'TranscriptionResultChanged':
                    # 中间结果
                    text = result['payload']['result']
                    callback(text, is_final=False)
                    
                elif result['header']['name'] == 'SentenceEnd':
                    # 最终结果
                    text = result['payload']['result']
                    callback(text, is_final=True)
                    
        except websockets.exceptions.ConnectionClosed:
            print("ASR连接已关闭")
    
    async def close(self):
        """关闭连接"""
        if self.ws:
            # 发送停止请求
            stop_msg = {
                "header": {
                    "message_id": self._generate_message_id(),
                    "task_id": self.task_id,
                    "namespace": "SpeechTranscriber",
                    "name": "StopTranscription",
                    "appkey": self.app_key
                }
            }
            await self.ws.send(json.dumps(stop_msg))
            await self.ws.close()
```

**TTS实时合成**:
```python
class TTSClient:
    def __init__(self, app_key, token):
        self.app_key = app_key
        self.token = token
        self.ws_url = f"wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1"
        self.ws = None
        
    async def connect(self):
        """建立WebSocket连接"""
        self.ws = await websockets.connect(self.ws_url)
    
    async def synthesize(self, text, voice="xiaoyu", callback=None):
        """合成语音"""
        # 发送合成请求
        synthesis_msg = {
            "header": {
                "message_id": self._generate_message_id(),
                "task_id": self._generate_task_id(),
                "namespace": "SpeechSynthesizer",
                "name": "StartSynthesis",
                "appkey": self.app_key
            },
            "payload": {
                "text": text,
                "voice": voice,
                "format": "pcm",
                "sample_rate": 16000,
                "volume": 50,
                "speech_rate": 0,
                "pitch_rate": 0
            }
        }
        
        await self.ws.send(json.dumps(synthesis_msg))
        
        # 接收音频流
        audio_chunks = []
        async for message in self.ws:
            if isinstance(message, bytes):
                # 音频数据
                audio_chunks.append(message)
                if callback:
                    callback(message)
            else:
                # JSON消息
                result = json.loads(message)
                if result['header']['name'] == 'SynthesisCompleted':
                    break
        
        return b''.join(audio_chunks)
```

---

#### 1.6 通话流程实现

**完整通话流程**:
```python
import asyncio
import sounddevice as sd
import numpy as np

class AICallHandler:
    def __init__(self, agent_id, aliyun_service, audio_manager):
        self.agent_id = agent_id
        self.aliyun = aliyun_service
        self.audio_manager = audio_manager
        self.is_active = False
        self.call_record = None
        
    async def handle_call(self, caller_info, greeting):
        """处理来电"""
        try:
            # 1. 执行自动接听动作（点击接听按钮）
            await self.auto_answer()
            
            # 等待通话建立
            await asyncio.sleep(2)
            
            # 2. 切换音频设备到虚拟设备
            self.audio_manager.switch_to_virtual()
            
            # 3. 初始化ASR和TTS
            asr_client = ASRClient(self.aliyun.app_key, self.aliyun.token)
            tts_client = TTSClient(self.aliyun.app_key, self.aliyun.token)
            
            await asr_client.connect()
            await tts_client.connect()
            
            # 4. 创建通话记录
            self.call_record = self.create_call_record(caller_info)
            
            # 5. 播放开场白
            if greeting:
                await self.speak(tts_client, greeting)
            
            # 6. 开始对话循环
            self.is_active = True
            
            # 启动音频捕获和播放
            capture_task = asyncio.create_task(
                self.capture_and_recognize(asr_client)
            )
            
            # 等待通话结束
            await self.wait_for_call_end()
            
            # 7. 清理
            self.is_active = False
            capture_task.cancel()
            
            await asr_client.close()
            await tts_client.close()
            
            # 8. 恢复音频设备
            self.audio_manager.restore_original()
            
            # 9. 保存通话记录
            await self.save_call_record()
            
        except Exception as e:
            print(f"通话处理失败: {e}")
            # 确保恢复音频设备
            self.audio_manager.restore_original()
    
    async def capture_and_recognize(self, asr_client):
        """捕获音频并识别"""
        # 配置音频捕获
        samplerate = 16000
        channels = 1
        blocksize = 1600  # 100ms at 16kHz
        
        # 静音检测
        silence_threshold = 500  # RMS阈值
        silence_duration = 2.0  # 2秒静音
        silence_start = None
        
        # 识别结果缓冲
        current_sentence = ""
        
        def audio_callback(indata, frames, time, status):
            nonlocal silence_start, current_sentence
            
            if status:
                print(f"音频状态: {status}")
            
            # 发送音频到ASR
            audio_data = indata.copy()
            asyncio.create_task(asr_client.send_audio(audio_data.tobytes()))
            
            # 静音检测
            rms = np.sqrt(np.mean(audio_data**2))
            if rms < silence_threshold:
                if silence_start is None:
                    silence_start = time.currentTime
                elif (time.currentTime - silence_start) > silence_duration:
                    # 静音超时，挂断电话
                    self.hangup("silence_timeout")
            else:
                silence_start = None
        
        def recognition_callback(text, is_final):
            nonlocal current_sentence
            
            if is_final:
                # 完整句子
                current_sentence = text
                print(f"用户: {text}")
                
                # 发送给Agent处理
                asyncio.create_task(self.process_user_input(text))
                
                current_sentence = ""
        
        # 开始音频流
        with sd.InputStream(
            device=self.audio_manager.virtual_input,
            channels=channels,
            samplerate=samplerate,
            blocksize=blocksize,
            callback=audio_callback
        ):
            # 接收识别结果
            await asr_client.receive_results(recognition_callback)
    
    async def process_user_input(self, user_input):
        """处理用户输入"""
        # 调用Agent生成回复
        agent_response = await self.call_agent(user_input)
        
        # 合成语音并播放
        await self.speak(self.tts_client, agent_response)
        
        # 记录对话
        self.call_record['messages'].append({
            "role": "user",
            "content": user_input,
            "timestamp": time.time()
        })
        self.call_record['messages'].append({
            "role": "assistant",
            "content": agent_response,
            "timestamp": time.time()
        })
    
    async def speak(self, tts_client, text):
        """播放语音"""
        # 合成语音
        audio_chunks = []
        
        async def audio_callback(chunk):
            audio_chunks.append(chunk)
        
        await tts_client.synthesize(text, callback=audio_callback)
        
        # 播放到虚拟输出设备
        audio_data = np.frombuffer(b''.join(audio_chunks), dtype=np.int16)
        audio_data = audio_data.reshape(-1, 1) / 32768.0  # 归一化到[-1, 1]
        
        sd.play(
            audio_data,
            samplerate=16000,
            device=self.audio_manager.virtual_output
        )
        sd.wait()
```

---

### 2. 音频设备管理

#### 2.1 设备检测与配置

**设备列表UI**:
```typescript
interface AudioDevice {
  id: number;
  name: string;
  type: 'input' | 'output';
  isDefault: boolean;
  isVirtual: boolean;
  channels: number;
  sampleRate: number;
}

function AudioDeviceSettings() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<number>();
  const [selectedOutput, setSelectedOutput] = useState<number>();
  
  useEffect(() => {
    // 加载设备列表
    loadDevices();
  }, []);
  
  const loadDevices = async () => {
    const deviceList = await invoke('get_audio_devices');
    setDevices(deviceList);
  };
  
  return (
    <div>
      <h3>输入设备（麦克风）</h3>
      <Select
        value={selectedInput}
        onChange={setSelectedInput}
        options={devices.filter(d => d.type === 'input')}
      />
      
      <h3>输出设备（扬声器）</h3>
      <Select
        value={selectedOutput}
        onChange={setSelectedOutput}
        options={devices.filter(d => d.type === 'output')}
      />
      
      <Button onClick={testVirtualDevice}>测试虚拟设备</Button>
    </div>
  );
}
```

---

### 3. 通话记录管理

#### 3.1 通话记录数据结构

```typescript
interface CallRecord {
  id: string;
  caller: {
    name: string;
    phone?: string;
    app: string; // '微信', '企业微信'
  };
  agent_id: string;
  agent_name: string;
  
  start_time: string;
  end_time: string;
  duration_seconds: number;
  
  hangup_reason: 'user' | 'ai' | 'timeout' | 'silence' | 'error';
  
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  
  summary?: string; // AI生成的通话摘要
  
  metadata: {
    session_id: string; // 阿里云会话ID
    total_tokens?: number;
    avg_confidence?: number; // ASR平均置信度
  };
}
```

---

### 4. 通话统计

#### 4.1 统计面板

**UI组件**:
```typescript
function CallStatistics() {
  const [stats, setStats] = useState({
    today_calls: 0,
    total_duration_hours: 0,
    avg_duration_seconds: 0,
    success_rate: 0
  });
  
  return (
    <div className="stats-grid">
      <StatCard
        title="今日通话"
        value={stats.today_calls}
        unit="次"
        icon={<PhoneIcon />}
      />
      
      <StatCard
        title="总通话时长"
        value={stats.total_duration_hours}
        unit="小时"
        icon={<ClockIcon />}
      />
      
      <StatCard
        title="平均时长"
        value={formatDuration(stats.avg_duration_seconds)}
        icon={<TimerIcon />}
      />
      
      <StatCard
        title="接通率"
        value={`${stats.success_rate}%`}
        icon={<CheckIcon />}
      />
    </div>
  );
}
```

---

## 技术架构

### Python Sidecar扩展

```
┌──────────────────────────────────────────────────────────┐
│                  Python Sidecar引擎                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              通话管理模块                            │ │
│  │                                                      │ │
│  │  - 来电检测（通知监听）                              │ │
│  │  - 自动接听控制                                      │ │
│  │  - 通话状态管理                                      │ │
│  │  - 通话记录管理                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                         ↓                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              音频管理模块                            │ │
│  │                                                      │ │
│  │  - 音频设备检测                                      │ │
│  │  - 虚拟设备管理                                      │ │
│  │  - 音频流捕获（sounddevice）                         │ │
│  │  - 音频播放                                          │ │
│  │  - 设备切换控制                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                         ↓                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          阿里云智能媒体服务客户端                    │ │
│  │                                                      │ │
│  │  - Token管理                                         │ │
│  │  - ASR Client（实时语音识别）                       │ │
│  │  - TTS Client（实时语音合成）                       │ │
│  │  - 对话管理                                          │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                 虚拟音频设备层                            │
│                                                           │
│  Windows: VB-CABLE Input/Output                          │
│  macOS: BlackHole 2ch                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 开发计划

### 时间线（共2个月）

#### 第1个月：基础架构与音频管理

**Week 1-2: 虚拟音频设备集成**
- [ ] 打包VB-CABLE/BlackHole驱动到应用
- [ ] 实现驱动安装脚本
- [ ] 实现设备检测功能
- [ ] 实现音频设备切换
- [ ] 音频设备测试工具

**Week 3-4: 来电检测与自动接听**
- [ ] Windows通知监听实现
- [ ] macOS通知监听实现
- [ ] 来电检测逻辑
- [ ] 接听规则配置UI
- [ ] 自动接听执行（RPA工作流）

---

#### 第2个月：语音服务与通话管理

**Week 5-6: 阿里云服务集成**
- [ ] 阿里云账号配置
- [ ] Token获取与管理
- [ ] ASR实时识别集成
- [ ] TTS实时合成集成
- [ ] 音频流处理

**Week 7-8: 通话管理与优化**
- [ ] 完整通话流程实现
- [ ] 通话记录存储
- [ ] 通话历史UI
- [ ] 通话统计面板
- [ ] 性能优化与测试
- [ ] Bug修复

---

### 开发任务分配建议

**Python后端团队（2人）**:
- 工程师C: 音频设备管理、虚拟设备集成
- 工程师D: 阿里云服务集成、通话流程实现

**前端团队（1人）**:
- 工程师B: 通话配置UI、通话记录UI、统计面板

---

### 开发里程碑

**Milestone 1（第1个月末）**: 音频基础完成
- ✅ 虚拟音频设备可用
- ✅ 音频设备切换正常
- ✅ 来电检测可用
- ✅ 自动接听可用

**Milestone 2（第2个月末）**: Phase 3完成
- ✅ 阿里云服务集成完成
- ✅ 完整通话流程可用
- ✅ 通话记录管理完成
- ✅ 通过验收标准

---

## 验收标准

### 功能性验收

#### 1. 虚拟音频设备
- [ ] Windows VB-CABLE安装成功率 > 95%
- [ ] macOS BlackHole安装成功率 > 95%
- [ ] 虚拟设备检测正常
- [ ] 音频设备切换正常
- [ ] 通话结束后设备恢复正常

#### 2. 来电检测
- [ ] 微信来电检测成功率 > 90%
- [ ] 企业微信来电检测成功率 > 90%
- [ ] 钉钉来电检测成功率 > 90%（可选）
- [ ] 来电人信息提取准确

#### 3. 自动接听
- [ ] 接听规则配置正常
- [ ] 自动接听执行成功率 > 90%
- [ ] 接听延迟 < 3秒

#### 4. 语音服务
- [ ] ASR识别准确率 > 85%
- [ ] TTS合成质量清晰
- [ ] 音频无明显延迟
- [ ] 对话流畅

#### 5. 通话管理
- [ ] 通话记录保存完整
- [ ] 通话历史查询正常
- [ ] 通话摘要生成准确
- [ ] 统计数据正确

---

### 性能验收

#### 1. 音频性能
- [ ] 音频采样率: 16kHz
- [ ] 音频延迟 < 200ms
- [ ] 音频质量清晰，无杂音
- [ ] CPU占用 < 20%（通话时）

#### 2. 识别性能
- [ ] ASR首字延迟 < 500ms
- [ ] TTS合成延迟 < 1s
- [ ] 端到端对话延迟 < 3s

#### 3. 稳定性
- [ ] 连续通话30分钟稳定
- [ ] 音频流不中断
- [ ] 内存占用稳定（< 300MB）

---

### 兼容性验收

#### 1. 操作系统
- [ ] Windows 10/11正常工作
- [ ] macOS 11.0+正常工作

#### 2. 通话应用
- [ ] 微信语音/视频通话支持
- [ ] 企业微信通话支持
- [ ] 钉钉通话支持（可选）

---

## 风险与应对

### 技术风险

#### 风险1: 虚拟音频设备安装失败
**影响**: 用户无法使用AI接听功能
**应对措施**:
- 提供详细的安装指南
- 提供手动安装选项
- 提供故障排查工具

#### 风险2: 音频质量不稳定
**影响**: 通话体验差
**应对措施**:
- 优化音频采样参数
- 添加降噪处理
- 提供音质测试工具

#### 风险3: 来电检测不准确
**影响**: 漏接或误接
**应对措施**:
- 完善通知匹配规则
- 提供手动确认选项
- 持续优化检测算法

---

## 交付物清单

### 代码交付物
- [ ] Python Sidecar扩展（通话模块）
- [ ] 前端UI代码（通话配置、记录）
- [ ] 虚拟音频驱动安装包
- [ ] 单元测试代码

### 文档交付物
- [ ] 虚拟音频设备配置文档
- [ ] 阿里云服务集成文档
- [ ] 通话流程技术文档
- [ ] 用户使用指南

---

## 附录

### 附录A: 阿里云智能媒体服务配置

**申请流程**:
1. 注册阿里云账号
2. 开通智能语音交互服务
3. 创建项目并获取AppKey
4. 创建AccessKey
5. 配置应用参数

**费用说明**:
- ASR: ¥0.0012/秒
- TTS: ¥0.0012/秒
- 免费额度: 每月500分钟

---

### 附录B: 虚拟音频设备下载

**Windows (VB-CABLE)**:
- 官网: https://vb-audio.com/Cable/
- 文件: VBCABLE_Setup_x64.exe

**macOS (BlackHole)**:
- 官网: https://existential.audio/blackhole/
- 文件: BlackHole2ch.pkg

---

### 附录C: 常见问题

**Q1: 为什么需要虚拟音频设备？**
A: 虚拟音频设备可以让我们捕获通话应用的声音输出，并将AI的声音输入到通话应用中，实现完整的音频闭环。

**Q2: 虚拟音频设备会影响正常使用吗？**
A: 不会。虚拟设备仅在通话时使用，通话结束后会自动恢复到原始设备。

**Q3: 支持哪些通话应用？**
A: Phase 3主要支持微信和企业微信。钉钉、腾讯会议等应用可以在后续版本支持。

**Q4: 通话记录会上传到服务器吗？**
A: 会。通话记录会同步到服务器，但用户可以选择删除。

**Q5: 通话时对方会知道是AI吗？**
A: 可以选择是否在开场白中说明。建议诚实告知对方这是AI助手。

---

### 附录D: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 查看 [Phase 3: 语音通话 - 后台服务迭代计划](./backend-service.md)

