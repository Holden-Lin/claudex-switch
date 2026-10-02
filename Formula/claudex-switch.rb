class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.16.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.16.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "e64728e10fdce7d8429b2a99099405fa249573304c721f34acd370d436ec7d74"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.16.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "f3799ef266540eb19d1ab12410035e31acdc670eeaa9de7676da02d05e81e1ba"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.16.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "dec9bc6cc9a666447f303d3b3a5bb819f091444eed82909c5c3c48d2b5ff5049"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.16.0/claudex-switch-linux-x64.tar.gz"
      sha256 "105e2b47b787d05b4ac1cb67b8f11190f4cbde2f0685ade502d15ab4b4142bbf"
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
