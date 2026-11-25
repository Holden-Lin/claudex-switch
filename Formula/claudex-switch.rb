class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.5"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.5/claudex-switch-darwin-arm64.tar.gz"
      sha256 "5d1f4e14e1615d0b60ee0f63eb777b951c7dbd4a2b143aa55576352c7d0c9c48"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.5/claudex-switch-darwin-x64.tar.gz"
      sha256 "bcfbb96d24141763c54a9cda6fe74b9660d539dce74db9aa70965e6bd2604a25"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.5/claudex-switch-linux-arm64.tar.gz"
      sha256 "21c77a71f0a7155023f5293a3ece5f26764a67f57a38d568618eb318d083b521"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.5/claudex-switch-linux-x64.tar.gz"
      sha256 "654837e65daddc8619836fd90b333199ce52aaeaee1a727aa7791616cd4f0868"
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
