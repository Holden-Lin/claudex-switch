class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.6"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.6/claudex-switch-darwin-arm64.tar.gz"
      sha256 "bcb36e8169bac00a16fe3a8e4597ce22a512302ff727af7a701fe4def2844cda"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.6/claudex-switch-darwin-x64.tar.gz"
      sha256 "e6ee649920eec77f52cd59e31ebaf187df24368fbb1959b4f1ec9869531afa57"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.6/claudex-switch-linux-arm64.tar.gz"
      sha256 "42cd0666afff74f3069293b22e675716a209d1d5de6002046fdccd03eafeae3d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.6/claudex-switch-linux-x64.tar.gz"
      sha256 "4d975370153eb7b61f8b57908d02cc5862b306ff6b2e64888848b81d50390df9"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
