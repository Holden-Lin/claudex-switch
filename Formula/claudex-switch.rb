class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.2.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "7f64e9fb2550efa1037fee88c94694aa2adbc1992fbe08c23a4e540c7e4bc171"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "6fb8f63c41581d8f90f33bb99eff1f983cbd8ca95808ff27576fed1f6a8e83da"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "f5d55fec6977348b8a8c2c4542580fe5c356793e7b566c53efdb212593fe7859"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.1/claudex-switch-linux-x64.tar.gz"
      sha256 "bb9b9ebadef238cafdebd9b9e6ce009ee8f61e3e999f7ffb7ed631e8221f1e52"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
