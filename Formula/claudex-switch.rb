class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.23.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "74bf71b3967fbff74930ababa2c7c1c86eb20ed16389c1d7a3b446bb5001d313"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "e5f5a45d9a03de5b6a168346b69ef1933d50760b6ce69c4884ddeec039ad915a"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "dcfa9012ca9284c9ecbabdbe765eba06fadef9fb5d184aa78cbf6a0c127baca7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.3/claudex-switch-linux-x64.tar.gz"
      sha256 "35e2e116df48043376bd0c899d0967aa863d444996aef675e26a347945957401"
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
