import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

test_dir = ROOT / '.jarvis-test'
os.environ.setdefault('JARVIS_DATA_DIR', str(test_dir))
os.environ.setdefault('JARVIS_LOG_FILE', str(test_dir / 'logs' / 'engine.log'))
