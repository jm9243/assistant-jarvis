from core.system.monitor import monitor


def test_monitor_returns_metrics():
    data = monitor.get_status()
    assert 'cpu' in data
    assert 'memory' in data
