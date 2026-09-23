class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.12.4"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "20a64ff6fda3d1e17d32aa4b25562b2e65efede3f7794b06c7a9d8ccd6044152"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "d57aa171e99a87bdf75fa1c73023e592d2525374c2a35fa393f67f7289092e2e"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "484197bf4ee339d94826b738f87de46fad6f63f3402d7862fa731056271db226"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.4/claudex-switch-linux-x64.tar.gz"
      sha256 "a40181298e34d65f1d627f72879d8297396a55d9ef15a2c4675840a097e19872"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
