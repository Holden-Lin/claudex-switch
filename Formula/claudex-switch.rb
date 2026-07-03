class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.29"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.29/claudex-switch-darwin-arm64.tar.gz"
      sha256 "94804af4332c62ce6042a3f32ed7e0d14823d1d776950364a3b9a60eb8d6f492"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.29/claudex-switch-darwin-x64.tar.gz"
      sha256 "63f48eb1aabe147575d5d1666c4a103d626a58ca42356dafa89b4a8b67006b84"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.29/claudex-switch-linux-arm64.tar.gz"
      sha256 "a8bd26c2311e2e93a8324628efb76a5cf6f76007c02615130c2fcf8a7da0c543"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.29/claudex-switch-linux-x64.tar.gz"
      sha256 "e649a5b7815469de20f4f73255ae11ed46d8df9817b62ee397dba8e645594d86"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
