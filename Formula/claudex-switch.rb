class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "0592093f52cc19823e2616923ff33bd808ccdf253d0494e1b6870550a65f4fa3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "3fb4736155e02af9b6152e4f697547c4a136e3c8536909852c592ca60ec09b18"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "59ca4f85486d05d8893f12e2c739a9458ca87f862f9b035f1d7e6cd6bcdc68dd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.1/claudex-switch-linux-x64.tar.gz"
      sha256 "52050b49f5d6d5cf2b30bfe5844676d1cc912866e8bed518e4b45519206ff03f"
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
