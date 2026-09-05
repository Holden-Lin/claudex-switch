class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.6.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ccbcb6f2a4f4e52a2bd65f9bc392010942141f4aa0ac03aa30e675aed2232a4f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "dcd473b2971093c2ba5d0ceb77a48238ec7b486fe1bb177d366d5b3a4e8d0879"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "53ceed0e5b357badf2aa6fe1df2004e582acd6670866dd582b9f77fac2a85858"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.0/claudex-switch-linux-x64.tar.gz"
      sha256 "32497bf4312a5f699640624bbc02de3644c185b12b00cc362c68f86715e6c741"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
