class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.21"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.21/claudex-switch-darwin-arm64.tar.gz"
      sha256 "31e013770a688f7fbbbade9798a6b68d44479d4c2dd1fa414b5c95f1d07f7f99"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.21/claudex-switch-darwin-x64.tar.gz"
      sha256 "05bcb100a96cf2a7e131b3a398904df420146a5b0a59fd7294ac1a7e2699b8f2"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.21/claudex-switch-linux-arm64.tar.gz"
      sha256 "4bdb59e9fc175e5bd1c1f71e7a34c2c189e6221b5502ffa103312d4cf225ee57"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.21/claudex-switch-linux-x64.tar.gz"
      sha256 "609560d139507ebd35a0de5b1d4cd14d7549a19864a6cc9f42e821639bc99c1b"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
