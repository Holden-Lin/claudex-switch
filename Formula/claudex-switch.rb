class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "1dc293be96e1ac1875124da064f394888e01de7f61501b4f5574f683a7920aef"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "098063a0752d839f203f0afef2b5712d65c370a777914024d83d033ff575f86b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "8bde1516a462a4aa77e2bf27b1cfdda57ac0b47010a9fd8d5086eca7e90ece4b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.2/claudex-switch-linux-x64.tar.gz"
      sha256 "2f63344eaaedcde6c788e07a08bdd1106cc6ff7a5d5458e8fb0b7c7f82c4db36"
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
