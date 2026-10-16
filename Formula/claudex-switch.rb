class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.23.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b2cc2d09371114b0804a05eb40c3f83aa78af7b47174d59ee9d2d2337b25adec"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "06fcc381266b7dbe9539d64e2b0c1b37e30f89731c23d7cf6e9e695d0bdf2317"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "b3f4aa201a3a37cfa6eb011ac7d7442048f00331ddf9b1e06e041dac1b80b64d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.0/claudex-switch-linux-x64.tar.gz"
      sha256 "2dba6cb6b081a936a7a68873100ecfc7960b8154da41a7d53663c0d9189713be"
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
