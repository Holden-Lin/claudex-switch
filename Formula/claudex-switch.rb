class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.5"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.5/claudex-switch-darwin-arm64.tar.gz"
      sha256 "c7164881aa7a2be86217991dd5da18657f54731011c6b44d89af4aafcab6ea5c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.5/claudex-switch-darwin-x64.tar.gz"
      sha256 "4fb8b7e18719ff0538e9655b7e1e54c7150d804c84fec76142afd25d7c2c9575"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.5/claudex-switch-linux-arm64.tar.gz"
      sha256 "20346447e4eec86ab9ef95ddbd5d20682d253ca35e7e0c9090b375b1d054e1ac"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.5/claudex-switch-linux-x64.tar.gz"
      sha256 "e97dd6a10b5f917e9be27e7d45196a11d3c6f8e6258911f76088b09122dde177"
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
