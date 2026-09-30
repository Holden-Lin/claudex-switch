class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.14.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.14.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "581cbe9276877e5984adeaef0a8ea258ceb24bbb271305f4a4e3313a9e13df97"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.14.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "1ec19fc626703fdf9eb97a3c67b2be43fc4cc441bead539ec7dadb51b57e3b26"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.14.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "e6a9141a9c90cab3ea4e2567399c84366ca1b816b0c3e3d88d3b930ce6b8086a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.14.0/claudex-switch-linux-x64.tar.gz"
      sha256 "dd20a7483696e709ca6f1b0eb1cafb77b1a50bc995b0e3a94908b56ec7fbc812"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
