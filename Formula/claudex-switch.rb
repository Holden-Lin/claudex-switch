class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.17"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.17/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f23351a9e150e5c5b6fa03e61f6ddbfb239215513705cf9dd7973dd5d10b9c8d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.17/claudex-switch-darwin-x64.tar.gz"
      sha256 "6f51b1ed6ab9e75d42b577646c97f9313d3942a7c6daa24b0c5c080ae59a4067"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.17/claudex-switch-linux-arm64.tar.gz"
      sha256 "29d022a7fd633f1e005fd8367aaa5758b965a9d8ad226c64153b104f155106e0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.17/claudex-switch-linux-x64.tar.gz"
      sha256 "e68524ee1a4ba04cf10a603d12f10654e97c4a6100f5a279bdb4216ad9a55bc0"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
