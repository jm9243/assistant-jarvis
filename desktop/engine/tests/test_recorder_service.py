import asyncio
import pytest
from core.recorder.service import recorder_service


@pytest.mark.asyncio
async def test_recorder_simulation_generates_steps():
    await recorder_service.start('auto')
    await asyncio.sleep(0.5)
    steps = await recorder_service.stop()
    assert isinstance(steps, list)
    assert len(steps) >= 1
