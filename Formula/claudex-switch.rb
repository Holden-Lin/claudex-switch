class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.11.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "02f4dae097d6a3324f56ff8f2ede93fc010c86129305f4ec38f3be68b45a0ca2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "296bbcd1190141b67ad6b1f6a2da6bf36bead05019a255b9b61cf16c9156fc97"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "56e75a0bb46a839bb58f4505d4f4c221a04b3d21cf3599cf51307bc125f69457"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.11.0/claudex-switch-linux-x64.tar.gz"
      sha256 "6e730a19c78611da99785c7802f3981f90a065c676bb1d1e615cad03f2d3025a"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
