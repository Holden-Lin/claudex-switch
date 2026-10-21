class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.5"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.5/claudex-switch-darwin-arm64.tar.gz"
      sha256 "d31d01cffd2bf009c9e11a280deb508c5cee7fb34d3ae8eeaf5a3b83291eeb4e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.5/claudex-switch-darwin-x64.tar.gz"
      sha256 "f3ac702bd59e0ffeeff77cc3a8a9acaced080d578a687d46b7a7bfc9c4f531cc"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.5/claudex-switch-linux-arm64.tar.gz"
      sha256 "3aa939d60a7271afae266b369cfca59ed9edd1292ba2a3bdf1870a06d251d0d2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.5/claudex-switch-linux-x64.tar.gz"
      sha256 "5443bd2c0a3e001620d227e8584755e9c39e5234d263333e866ddc84d0df75a4"
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
