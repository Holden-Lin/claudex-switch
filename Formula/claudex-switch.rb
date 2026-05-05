class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.19"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.19/claudex-switch-darwin-arm64.tar.gz"
      sha256 "d2edfcb52c34be0a6f0f1310d46520832abc971afdd1c5c83889dd3c77f738b5"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.19/claudex-switch-darwin-x64.tar.gz"
      sha256 "f0d550a8776d96d84dbbdad197512c48700d73bcb31cff19fb546001be2ea973"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.19/claudex-switch-linux-arm64.tar.gz"
      sha256 "514d6943c3a5d09f5c900783351373124cd6b617e5393c5e5317c28faee0f8f7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.19/claudex-switch-linux-x64.tar.gz"
      sha256 "73d2972a09a95f85cbd0de2d4955070406f120fdfed05a0602c84487140d79d5"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
