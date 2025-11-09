"""软件扫描"""
from __future__ import annotations

import json
import platform
import plistlib
from datetime import datetime
from pathlib import Path
from typing import List

from utils.config import settings


CAPABILITY_MAP = {
    'wechat': ['notification', 'ui-automation'],
    'enterprise wechat': ['notification', 'ui-automation'],
    'ding': ['notification', 'ui-automation'],
    'chrome': ['web-automation'],
    'slack': ['notification', 'webhooks'],
}


class SoftwareScanner:
    def __init__(self) -> None:
        self._cache_file = settings.data_dir / 'data' / 'software.json'
        self._cache_file.parent.mkdir(parents=True, exist_ok=True)

    def scan(self) -> List[dict]:
        system = platform.system().lower()
        if system == 'darwin':
            items = self._scan_macos()
        elif system == 'windows':
            items = self._scan_windows()
        else:
            items = self._fallback_items(system)
        self._cache_file.write_text(json.dumps(items, ensure_ascii=False, indent=2))
        return items

    def _scan_macos(self) -> List[dict]:
        apps: List[dict] = []
        search_paths = [
            Path('/Applications'),
            Path.home() / 'Applications',
            Path('/System/Applications'),
        ]
        for base in search_paths:
            if not base.exists():
                continue
            for app_path in base.glob('*.app'):
                plist_path = app_path / 'Contents' / 'Info.plist'
                if not plist_path.exists():
                    continue
                try:
                    with plist_path.open('rb') as handle:
                        plist = plistlib.load(handle)
                except Exception:
                    continue
                name = plist.get('CFBundleName') or app_path.stem
                bundle_id = plist.get('CFBundleIdentifier', app_path.stem)
                version = plist.get('CFBundleShortVersionString') or plist.get('CFBundleVersion', 'unknown')
                apps.append(self._build_item(name, version, 'macos', bundle_id, str(app_path)))
        return apps or self._fallback_items('macos')

    def _scan_windows(self) -> List[dict]:
        try:
            import winreg  # type: ignore
        except ImportError:
            return self._fallback_items('windows')
        apps: List[dict] = []
        uninstall_keys = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"),
        ]
        for hive, path in uninstall_keys:
            try:
                key = winreg.OpenKey(hive, path)
            except FileNotFoundError:
                continue
            for index in range(0, winreg.QueryInfoKey(key)[0]):
                try:
                    subkey_name = winreg.EnumKey(key, index)
                    subkey = winreg.OpenKey(key, subkey_name)
                    name, _ = winreg.QueryValueEx(subkey, 'DisplayName')
                    version, _ = winreg.QueryValueEx(subkey, 'DisplayVersion')
                    apps.append(self._build_item(name, version, 'windows', subkey_name, 'registry'))
                except OSError:
                    continue
        return apps or self._fallback_items('windows')

    def _build_item(self, name: str, version: str, platform_name: str, identifier: str, location: str) -> dict:
        key = name.lower()
        capabilities = next((caps for pattern, caps in CAPABILITY_MAP.items() if pattern in key), ['ui-automation'])
        compatibility = 'full' if 'ui-automation' in capabilities else 'partial'
        return {
            'id': identifier,
            'name': name,
            'version': version,
            'platform': platform_name,
            'path': location,
            'compatibility': compatibility,
            'capabilities': capabilities,
            'lastSeenAt': datetime.utcnow().isoformat(),
        }

    def _fallback_items(self, platform_name: str) -> List[dict]:
        return [
            self._build_item('Chrome', 'latest', platform_name, f'{platform_name}-chrome', 'fallback'),
            self._build_item('Slack', 'latest', platform_name, f'{platform_name}-slack', 'fallback'),
        ]


scanner = SoftwareScanner()
