class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "4b4dc9e8ca420ef2eefad0f3a4efbbe5940a80377b7c16446c52290e6fa2de56"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "930dff11e5615857c67009c884586c8df57324a0fa6579065651e66208b9ec84"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "f0c1b3c887db702d84a70f6721cb8e6a01de70e6744ad6d3e5642943df38f5e5"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.2/claudex-switch-linux-x64.tar.gz"
      sha256 "8e147e6cd87d27cacbaf6c0893851d3482734edfc85e79e90015f014fd41f430"
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
