class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.5.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "521f08062e6cb27ed28f685bf91c575023d60588ea0dfd19e7aacfa2a09342e0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "b6fad61a6761c4b69c839ecd9a48590060e1ccd146b2cbfb97df5485cdf554dd"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "84956b8bacbea27346f402903ed74502e0b33e5cf6ae2e222bb3aa141b3984c2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.5.1/claudex-switch-linux-x64.tar.gz"
      sha256 "38e8b0b90d427f63d34e02f5ea8cc4a3dd7a59855131ebdc06bd234e07ab2149"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
