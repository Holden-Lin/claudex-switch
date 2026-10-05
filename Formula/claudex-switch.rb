class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.18.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "8596a9ab86a0974ffba887f65a8051b997af31296c8c9bb9adc8f3c600f3ef78"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "c7331cf6b05f93baf599b7377f0e35c7df5aec49b38bd32fa4d68b71898433b0"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "45b1c873f90fd5fb23a97423cdb088b44effee9c36dceda8751b27548e4bb13f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.3/claudex-switch-linux-x64.tar.gz"
      sha256 "aa6ccba6a0e4a3c47fc475ba82f41713ce040035ad2f69bf7009a5270eea6e24"
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
