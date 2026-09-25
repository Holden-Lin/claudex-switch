class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.13.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "3fa79c2990673164a53240c1faca05be8ac03bb4af78f66749667ff8f9f5d3fd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "c30ac0052cb903364c49b76932ab42c42b4163ae1297371b5d69f7a9fb9e6828"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "f1bc95f8cc2be8eac782fb099a5281af8703fef85b44f03a6713a33765093c46"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.0/claudex-switch-linux-x64.tar.gz"
      sha256 "1f244e3feb8f69da3a7d99b7ae42e47c928265c5966d561cc730782787b545d2"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
