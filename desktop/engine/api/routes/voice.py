"""语音通话API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.call.service import voice_service
from models.common import Result

router = APIRouter()


class DeviceConfigRequest(BaseModel):
    input: str | None = None
    output: str | None = None
    virtual_input: str | None = None
    virtual_output: str | None = None


class CallCreateRequest(BaseModel):
    contact: str
    channel: str = 'wechat'


class TranscriptRequest(BaseModel):
    role: str
    content: str


class CallFinishRequest(BaseModel):
    reason: str
    summary: str | None = None
    tags: list[str] | None = None


@router.get('/devices')
async def list_devices():
    return Result(success=True, data=[device.model_dump() for device in voice_service.list_devices()])


@router.post('/devices')
async def configure_devices(payload: DeviceConfigRequest):
    mapping = {k: v for k, v in payload.model_dump().items() if v}
    data = voice_service.configure_devices(mapping)
    return Result(success=True, data=data)


@router.get('/status')
async def voice_status():
    return Result(success=True, data={'devices': voice_service.virtual_device_status(), 'stats': voice_service.stats()})


@router.get('/calls')
async def list_calls():
    return Result(success=True, data=[call.model_dump() for call in voice_service.list_calls()])


@router.post('/calls')
async def start_call(payload: CallCreateRequest):
    call = voice_service.start_call(payload.contact, payload.channel)
    return Result(success=True, data=call.model_dump())


@router.post('/calls/{call_id}/transcript')
async def append_transcript(call_id: str, payload: TranscriptRequest):
    call = voice_service.append_transcript(call_id, payload.role, payload.content)
    return Result(success=True, data=call.model_dump())


@router.post('/calls/{call_id}/finish')
async def finish_call(call_id: str, payload: CallFinishRequest):
    call = voice_service.finish_call(call_id, reason=payload.reason, summary=payload.summary, tags=payload.tags)
    return Result(success=True, data=call.model_dump())


@router.post('/tests/audio')
async def audio_test():
    return Result(success=True, data=voice_service.run_audio_test())
