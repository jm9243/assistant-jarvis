#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '\e[33m[fix-rust]\e[0m %s\n' "$1"
}

# Check if Rust is installed via Homebrew
if brew list rust &>/dev/null; then
  log "⚠️  Detected Homebrew-installed Rust. This can cause LLVM conflicts."
  log "Uninstalling Homebrew Rust..."
  brew uninstall rust --ignore-dependencies
fi

# Check if rustup is installed
if ! command -v rustup &>/dev/null; then
  log "Installing rustup (the official Rust toolchain manager)..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  log "rustup already installed ✓"
fi

log "Fixing ownership for ~/.rustup and ~/.cargo"
sudo chown -R "$USER":"$USER" "$HOME/.rustup" "$HOME/.cargo" 2>/dev/null || true

log "Setting rustup default toolchain to stable"
rustup default stable
rustup update

# Add macOS targets
log "Adding macOS targets..."
rustup target add aarch64-apple-darwin || true
rustup target add x86_64-apple-darwin || true

log "rustc version:"
rustc -V

log "✅ Rust toolchain ready!"
log "Next steps:"
log "  1. Close and reopen your terminal (or run: source ~/.cargo/env)"
log "  2. Run: cd desktop/frontend && npm run tauri dev"
