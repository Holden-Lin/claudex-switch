class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.8.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "20b07b923d700602e5e70f514e05fd1e97f3e1e3e199765371ef61b3a7bb7c26"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "da300b434b8e2c7bd8f8c06f2940a7d79a7c4cc605598aea9b8df934bcb78370"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "5a65480e0539cb2edd88ed13199b20d0c46829ff6eab5c7f529d59d6f9a09aeb"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.0/claudex-switch-linux-x64.tar.gz"
      sha256 "6ffbf60cbd08e3353d62d0f2f515837d7ec39e00476b581e032af8f6ef3ac952"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
