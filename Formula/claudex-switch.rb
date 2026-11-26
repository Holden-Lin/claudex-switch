class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.31.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "72c2b56b0148cd4a6e43e8c973e150fd04e0e2be98586f032dca06d76f0440e0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "4c2912a6750c7ee7c2cd72c77b20d06adc08c570c1fbaa15145417e89303607e"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "9c48dc7fb8719b68a8d5a941b5fec6d5bc2b3fdb9d0a83ccf282c71571061d2e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.0/claudex-switch-linux-x64.tar.gz"
      sha256 "0cbec029e28d19364485f19edae48da3cb6266404c6755c12678c07b7c5e2572"
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
