class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.5.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "01568f6aee243d72e1b8fdab5be1518ec87b3e7552cccaea8d3a81708ea8238d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "782ae5d07d3b1d84702341fdfea3c42e9497b5f72b79d2cab52fc50ac8bf460f"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "d96820a2cbb6310e32e5e0472fcc64560bf4cd14c4d971ca65b2503fe2971493"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.0/claudex-switch-linux-x64.tar.gz"
      sha256 "bb58dbd82c56cf098d2a8353668be1c26b17336c93ffcd76b78a1aa0a452f7c9"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
