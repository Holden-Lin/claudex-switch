class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.6"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.6/claudex-switch-darwin-arm64.tar.gz"
      sha256 "bc7ada1e7190a9935687ed5c2fd310c8f3d0d503e7579789250fb0a47ca1b919"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.6/claudex-switch-darwin-x64.tar.gz"
      sha256 "b910d0e93fcde8593454f7771ac6e3f206b5f229aae55e2d143b1374547a5901"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.6/claudex-switch-linux-arm64.tar.gz"
      sha256 "dea9e8b79ccd9e05648bd263f51182794e5037c42499bce1ab3b1f86ee4a4c45"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.6/claudex-switch-linux-x64.tar.gz"
      sha256 "2fe3715d5548233a976d5c472845f1d53252d9ca0e1b51c339c9e78a5570fc77"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md", "THIRD-PARTY-NOTICES.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
