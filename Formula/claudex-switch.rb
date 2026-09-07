class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.6.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "1a5c734064cbf47b38ac4d48aa418c0218fdfe8423c7f02fa34c94425f43316f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "8d19b0b80eb8b13182c41ed7428e349b12ea44bc9bd3dd76464a07fef70fdb16"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "0e5ea27d084dce4f7144f4e0a81cda22398eabcc98dc8da35d96b9ba9a7fe1a9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.6.1/claudex-switch-linux-x64.tar.gz"
      sha256 "507bacb197e85e9f8f9a0b1f7e7ac08dd3b0bf0ac31aef008d14ddc5bbde9f6d"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
