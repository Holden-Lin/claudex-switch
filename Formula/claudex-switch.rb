class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.18.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f85e4a696a27b12a02a5c93a25234efbcc8ab4419dcde32901f74de5ea0cd71c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "f9a1d68f492a5e358c9c228a038f94761ad1decfa24548ea6180ff10e97d28c2"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "82698aaaf13c4bfcf69be3a46bb508ee3b6d7b1103389ba00b47c8cb66befec6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.0/claudex-switch-linux-x64.tar.gz"
      sha256 "a5fec8deedef9c18b6854b7b9ff0ce6ef7603618615ffe664fc82df2db7cdcac"
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
