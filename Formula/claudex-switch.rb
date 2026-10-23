class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "da929b62d641d7f4713701371e0719b0e0524f1da785ec021640c1642269c69d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "c07819cf3ce51b76cdfc0c7dd54ddb8b939d4f8101821a0b59d726acef1b9793"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "7a4d6fa52baaa9d2a23d8936b59b0b7559db4bff592790bd102510626f02e746"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.3/claudex-switch-linux-x64.tar.gz"
      sha256 "4cb4562578334f010d858a85e15667c8fd3bba962d148aebd78f80e87ea4db6f"
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
