class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.9"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.9/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ec518137789d90b252daab5d4101a4eb143ba23073556c2522b96af6444e3541"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.9/claudex-switch-darwin-x64.tar.gz"
      sha256 "dbebde9ba849fb9a17f6a3a29e3bfcbb69a2541b3cd41740407aaf46c9aced62"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.9/claudex-switch-linux-arm64.tar.gz"
      sha256 "585fbd1d6f0317d00d6a2dbce27f5085d8c53d3f622abb91a24866dfa3451ec3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.9/claudex-switch-linux-x64.tar.gz"
      sha256 "9617403d92fa967dcd1d205b0e24c959dd664c2f3d2dd4c3ed0e0daba5ead45f"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
