class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.27.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "45523989b00fd1107fa48e65aae4b7ad15074ffdbc6552f2ce5dec27c4772dc6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "c7ab6e794ed90d73d4c831225419194d3224bc57f5964881d5cce72ecd50a4ac"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "79a12d76e2c776cfc83a52ecd87366f0588c745e444ada68cc1d3925ff87ff47"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.0/claudex-switch-linux-x64.tar.gz"
      sha256 "1ae711a40ad49b8aefb72cbdc0f4636cdc37d6755761b857075b165cd38bccdc"
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
