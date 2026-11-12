class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.5"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.5/claudex-switch-darwin-arm64.tar.gz"
      sha256 "8bc4fbce61e22130c20f1d0229c110da4dfe06ce7aef1545796937f327e6ba0a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.5/claudex-switch-darwin-x64.tar.gz"
      sha256 "690e2aa659155a2785a82395e7fded3d7d14feadea1fb964e2046cc774a09882"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.5/claudex-switch-linux-arm64.tar.gz"
      sha256 "04b3e0af0bc3abf52acaef37e3ee99a255fa5b063bb977caf50d6b36c2ee80ad"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.5/claudex-switch-linux-x64.tar.gz"
      sha256 "8746bfb709d48f14cafbec4cc8ae1e7bf3e0d1c89ece7deb78e33a59dd6af8b6"
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
