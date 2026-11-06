class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "825532e4233930315b98f567743a834176f9640c78594251ec840e82057a1e33"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "aa2f608298ca4abfd3cc0324396ffef0336ed0006ec3f87e8007c636239d5fd3"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "036dfc7bcd0a4e688b9429053200091f0f9dd42a001bd94a30f20447d8e22e17"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.3/claudex-switch-linux-x64.tar.gz"
      sha256 "33f575946a539263a0600fd903c7a36f47b3cbb55574962c4f3af2cb0c868619"
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
