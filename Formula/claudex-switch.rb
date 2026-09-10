class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.8.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b452f32ae0769e19c67eaac802f031a2923cef38f64dc6a0d76c9220d24a872c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "7946fabf58b4dc25c540ee17289a31413b33ce9e4f8b65a5f7f06e9c71d669ac"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "431ad9c52e416623405c038aa723f5c704374092ce04d9e1ea7ea0c4f9df3f70"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.8.1/claudex-switch-linux-x64.tar.gz"
      sha256 "0f1d1ac4e7ee3845031b7d8e2042b265d30c1f25aa621de15cfbc9e2f7949ae0"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
