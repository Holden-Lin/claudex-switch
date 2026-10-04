class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.18.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "e1036a1d1dded70c1cc3905af4ad397c77d3371abef5a796eca04088b967c920"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "61236a49cfb8faa2eee65ddcf9cb88c4f68a48a2361c85272564837a2336202d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "17821b6c1e9c243d6b8da4673271a43020c9facc61d5931b6b0dc19c90a43566"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.1/claudex-switch-linux-x64.tar.gz"
      sha256 "10cd09947fceeb052fdc13bd90d701e0a7dec1527fcbb15b28a99b60754aa561"
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
