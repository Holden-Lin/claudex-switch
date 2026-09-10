class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.7.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "d3d86eb482bd7d63b5d50875e283d15d7759e4a9f7ef84e90e67f4b2e7eadfca"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "1d421bc16a93988e89c1cc5cfeb348cf097df8a2afc8e0735d78babdcbf07587"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "2e3590c7767cd30ba3efe5d667fd826136416a4084fcabbd70cb12a478afc6a2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.1/claudex-switch-linux-x64.tar.gz"
      sha256 "5fac1eb2ee7f0db760e9ffc875a30b28edf5892a24df766e603c2d081ede768c"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
