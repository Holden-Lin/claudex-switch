class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.3"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "eef44debc8eca9b4b8a96ecf7fe5057eaff3a41349cbaa3e96000640b508de52"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "0a4eeb499cef42e980a6dc2737d351d0d0e8f1ac2c03ebc3b911320e7bdaaaee"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "b0fd0027d2bcc613b0972f8c15502477a1b6f38d27176850dfa7056bbe9afd80"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.3/claudex-switch-linux-x64.tar.gz"
      sha256 "5e51c6665a732a6d351795eb8d42f37230b50bb4113a85008d812fe5cbbe4c39"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
