"""语音通话与设备服务"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from loguru import logger

from models.call import AudioDevice, CallRecord, CallTranscript
from utils.config import settings
from utils.datastore import JsonStore, generate_id

try:  # 可选依赖
    import sounddevice as sd  # type: ignore
except Exception:  # pragma: no cover - 可选依赖
    sd = None


class VoiceService:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._call_store = JsonStore(data_dir / 'call_records.json', [])
        self._settings_store = JsonStore(data_dir / 'voice_settings.json', {})

    # ------------------------- 设备能力 -------------------------
    def list_devices(self) -> List[AudioDevice]:
        devices: List[AudioDevice] = []
        if sd:
            for index, info in enumerate(sd.query_devices()):  # type: ignore[attr-defined]
                device_type = 'input' if info['max_input_channels'] > info['max_output_channels'] else 'output'
                devices.append(
                    AudioDevice(
                        id=f"dev-{index}",
                        name=info['name'],
                        type=device_type,  # type: ignore[arg-type]
                        is_virtual=self._is_virtual(info['name']),
                    )
                )
        if not devices:  # fallback
            devices = [
                AudioDevice(id='dev-out-default', name='系统扬声器', type='output'),
                AudioDevice(id='dev-in-default', name='系统麦克风', type='input'),
                AudioDevice(id='dev-virt-out', name='BlackHole 2ch', type='output', is_virtual=True),
                AudioDevice(id='dev-virt-in', name='VB-CABLE Input', type='input', is_virtual=True),
            ]
        selected = self._settings_store.read().get('devices', {})
        for device in devices:
            if selected.get(device.type) == device.id:
                device.selected = True
        return devices

    def configure_devices(self, mapping: Dict[str, str]) -> Dict[str, str]:
        settings_data = self._settings_store.read()
        settings_data.setdefault('devices', {}).update(mapping)
        self._settings_store.write(settings_data)
        return settings_data['devices']

    def virtual_device_status(self) -> Dict[str, bool]:
        devices = self.list_devices()
        return {
            'has_virtual_input': any(device.type == 'input' and device.is_virtual for device in devices),
            'has_virtual_output': any(device.type == 'output' and device.is_virtual for device in devices),
        }

    def _is_virtual(self, name: str) -> bool:
        lowered = name.lower()
        return 'blackhole' in lowered or 'vb-cable' in lowered or 'virtual' in lowered

    # ------------------------- 通话记录 -------------------------
    def list_calls(self) -> List[CallRecord]:
        return [CallRecord.model_validate(item) for item in self._call_store.read()]

    def start_call(self, contact: str, channel: str) -> CallRecord:
        call = CallRecord(id=generate_id('call'), contact=contact, channel=channel)
        calls = self.list_calls()
        calls.append(call)
        self._call_store.write([item.model_dump() for item in calls])
        logger.info('Start AI call %s -> %s', call.id, contact)
        return call

    def append_transcript(self, call_id: str, role: str, content: str) -> CallRecord:
        calls = []
        updated: CallRecord | None = None
        for call in self.list_calls():
            if call.id == call_id:
                transcript = CallTranscript(role=role if role in {'caller', 'assistant', 'system'} else 'system', content=content)
                call.transcript.append(transcript)
                updated = call
            calls.append(call)
        if not updated:
            raise ValueError('Call not found')
        self._call_store.write([item.model_dump() for item in calls])
        return updated

    def finish_call(self, call_id: str, *, reason: str, summary: str | None = None, tags: List[str] | None = None) -> CallRecord:
        calls = []
        updated: CallRecord | None = None
        for call in self.list_calls():
            if call.id == call_id:
                ended = datetime.utcnow()
                duration = int((ended - call.started_at).total_seconds())
                updated = call.model_copy(update={
                    'status': 'completed',
                    'hangup_reason': reason,
                    'ended_at': ended,
                    'duration_seconds': duration,
                    'summary': summary,
                    'tags': tags or call.tags,
                })
                calls.append(updated)
            else:
                calls.append(call)
        if not updated:
            raise ValueError('Call not found')
        self._call_store.write([item.model_dump() for item in calls])
        logger.info('Finish AI call %s (%ss)', call_id, updated.duration_seconds)
        return updated

    # ------------------------- 统计 -------------------------
    def stats(self) -> Dict[str, float]:
        calls = self.list_calls()
        if not calls:
            return {'today': 0, 'total_duration': 0, 'avg_duration': 0, 'answer_rate': 1.0}
        today = datetime.utcnow().date()
        today_calls = [call for call in calls if call.started_at.date() == today]
        durations = [call.duration_seconds for call in calls if call.duration_seconds]
        answered = len([call for call in calls if call.status == 'completed'])
        return {
            'today': len(today_calls),
            'total_duration': sum(durations),
            'avg_duration': round(sum(durations) / len(durations), 2) if durations else 0,
            'answer_rate': round(answered / len(calls), 2),
        }

    def run_audio_test(self) -> Dict[str, float]:
        # 模拟音频测试结果
        return {
            'latency_ms': 85.0,
            'packet_loss': 0.01,
            'jitter_ms': 5.2,
        }


voice_service = VoiceService()
