class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.7"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.7/claudex-switch-darwin-arm64.tar.gz"
      sha256 "6b9c201f46bbbcf1cf54b9f5917afe01181f207e8e6c010a9370b0cba145ab61"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.7/claudex-switch-darwin-x64.tar.gz"
      sha256 "2c3b999ba3704b05e527b93b908d5e5a31cb458e6e2df70eb02bd5cd204d9a86"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.7/claudex-switch-linux-arm64.tar.gz"
      sha256 "1accf970521f976d9b80f313a5f982edc916a4f2bc0db095ed8406633b8b439b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.7/claudex-switch-linux-x64.tar.gz"
      sha256 "566d81278505fbb34aeb81f341297373b1d40a0dc0dd1c56daacf12dab6a4f3e"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
