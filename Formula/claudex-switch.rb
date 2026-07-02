class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.27"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.27/claudex-switch-darwin-arm64.tar.gz"
      sha256 "09f870699dc1748f2c14f32c8367776a909b19c0183db732c36b9fb3b2c04bb0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.27/claudex-switch-darwin-x64.tar.gz"
      sha256 "c22c052e27c60a6353c935a4dbfb23a4199561608a12c16b23264a0a9ce06439"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.27/claudex-switch-linux-arm64.tar.gz"
      sha256 "b890a679424e90cada1061aa5e6d34674d306fa3fdb42181d177530e07c0530d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.27/claudex-switch-linux-x64.tar.gz"
      sha256 "991d6daa7539dd5d8142a8f3997de1c11132a324ed71d21a3d7f84dc0e22c16c"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
