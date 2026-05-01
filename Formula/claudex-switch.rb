class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.12"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.12/claudex-switch-darwin-arm64.tar.gz"
      sha256 "a50cbe39586b3b35cd08493aa8a89e7233607301b2c5958e37556eaf3cdf6305"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.12/claudex-switch-darwin-x64.tar.gz"
      sha256 "974489cb62415229554619f55fa5f507ff06589790e6c82b19072cb6dbd7ca9b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.12/claudex-switch-linux-arm64.tar.gz"
      sha256 "76b5ff569905dfb1556552c2bb94f9b7ba5803fa69ea7ded04a433dde74302cf"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.12/claudex-switch-linux-x64.tar.gz"
      sha256 "2fa2f62acf6a353d2213e513e557de75216aea28185510b4bb248d40505ead03"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
