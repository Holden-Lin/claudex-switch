class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.3.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.3.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ea90f8386f3ace0dacff5211129ae9008f430cdfb225c5fbadc65c37bf91dd83"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.3.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "4b28d3c71726e6af32854b69ed23596e8b7975becbd27bfbdf2fedff5c328070"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.3.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "acdc2175a6ca4cab7c901d86b5cc5dfa1e7a1c2f648de1302baf6bef1496b695"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.3.0/claudex-switch-linux-x64.tar.gz"
      sha256 "042379cf982bc9b04c4639f4eaf7082fca1b0bd26ca5c7fec79d6264752c5dc8"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
