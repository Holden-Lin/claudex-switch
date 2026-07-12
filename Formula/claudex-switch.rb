class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.31"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.31/claudex-switch-darwin-arm64.tar.gz"
      sha256 "e94714c5383e3647bacf1df6eba6617f4ee394d52600a13c8ea523b7fe3aa6dc"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.31/claudex-switch-darwin-x64.tar.gz"
      sha256 "ec90325bfe8f675ed5058b57deff72654e4618d5aabf93d77894055490922e6d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.31/claudex-switch-linux-arm64.tar.gz"
      sha256 "a07d4fccc63ecf78898f2cc825a690a3041b7e707c4a2dc704e38457bcfe109d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.31/claudex-switch-linux-x64.tar.gz"
      sha256 "83e47e22dc7c3e91de3c6b1cc9ffb0aa99522f3c2ddec9058e19fc16cbad3557"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
