class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.24.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.24.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "693a1e07992d40135c8b05c366bdc7cb0e3a5d3a1800659371981277cd0732ad"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.24.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "77513e798809716e1a16a2b14266b5bcebd859225c2d2f09ecb6a985efa12a96"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.24.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "6b8121e2a726f705656cedb7c715ba0cc7b874d526db09b0976986f32985a3ae"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.24.0/claudex-switch-linux-x64.tar.gz"
      sha256 "8ea31eecc0a884023d79c675d12cb56866e1090fdb5a4a4fea1a821f6bab6a67"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
