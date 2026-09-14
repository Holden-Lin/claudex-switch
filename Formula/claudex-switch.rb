class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.11.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "0c11d67168011a549044a8dc4c8166fd71280a28ad387f1e1eac9a6798b7b23a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "70c675124cd79c938663a7fc885ea5b4f16214668be7c47fa705a1c99b83b63c"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "ab3a7fa5fdd960d107725cb57c139b6f4054256795c6eabf8cf2654425abff4e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.1/claudex-switch-linux-x64.tar.gz"
      sha256 "3761c6be35940543aa4a0dff4f012a689a12bef1fa5179e6c0e6d825d011649a"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
