class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.0.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.0.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "9c07bf46b116c04b5e55c0b3c8506aa8eb1b31ace8eefb0aa61ce4d3a48d57ff"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.0.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "f2b9a50af532029ad0ce2db2cb86122c23f761c2acfe01b897610fa096f5d062"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.0.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "dce21c34216d5f8b5936776bf73675eb9d7ad64a7e7d075c8f79d0d4356700f3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.0.0/claudex-switch-linux-x64.tar.gz"
      sha256 "b93a7f504d4271dea35fd05a2ec96f7cf11799e31143ad44aa1e1d29c45501ab"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
