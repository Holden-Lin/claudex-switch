class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.21.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.21.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "c6dd50671b7c6b72a37164cde2dc2a397b422cc0c759c906fa3e90b66c8b5543"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.21.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "41000fce8f2195f8a9c6021218ef413c36b17dc7ffe91f219faaa6eb7441ce3d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.21.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "d1c67228e4f383c60c2ac7499bf6f4dd2ec262574ef8ef4f5baedefe33002bca"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.21.0/claudex-switch-linux-x64.tar.gz"
      sha256 "e30f4a32127747f77f47c7de6bf75ac7ddc68803f6a953594a707d49ae5e4022"
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
