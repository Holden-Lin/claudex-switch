class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.11"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.11/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b71c8b86460a54fcbc768d63970fd0deb70f917333461bcdd12c735b754dc15f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.11/claudex-switch-darwin-x64.tar.gz"
      sha256 "8a56e9c47d3f42368170ca352bfbdf2061651da96aad350132a6f96d1cea9460"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.11/claudex-switch-linux-arm64.tar.gz"
      sha256 "0182efa4f9608059028f4876faabed1e8fe2bcd433ac12d3d8ed0f0b150cbb9a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.11/claudex-switch-linux-x64.tar.gz"
      sha256 "941175e8807ca1b169b72d475459be59820ff97c9d94bacc7751c34515d01a1d"
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
