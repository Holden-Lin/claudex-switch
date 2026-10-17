class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "cfc0e23db8608e4abffbee0d1f9f6b3121800be62b646ba77c21feda791d7bd1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "a03e2fd69abe533d56ee3ee768fbc6596d428df9431f05f099f82df935569525"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "c06e8cb8fe55c2778e1a7c640cc60e7ca1604f7f55ecfb0120cd16c9cbe1d685"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.0/claudex-switch-linux-x64.tar.gz"
      sha256 "d391b92f93472d2231c19a075b5bdec2ac47222e129004675b876e5ae76e2dcd"
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
