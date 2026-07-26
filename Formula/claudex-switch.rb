class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.2.2"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ea168e9bbdc6fcb31233a06094ba2b3e7528af5273761ff88fbdf4c6ef9a64f9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "e82740b1ae739dadf8b2d966e3c35245390511baf07de77afd6b89d7c19ca5bb"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "7112c1c3cafdc2167c67d90c4a31758ebef155b7a21270164c7e718f326d6bab"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.2/claudex-switch-linux-x64.tar.gz"
      sha256 "7838d5e3f56b25dd0064764f5f2855f6fcff6ee4ec28eab6f7ef9c6ae9c90102"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
