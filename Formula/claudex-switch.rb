class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b6cedb740900d09c37dab13bb3b9224dcd4ea7217024c7f3bf1490f246990b57"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "0f54baff0cab2de0d9bd4ad3158fccc9bbdcb1addd26542bc57fb621d4f57f94"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "254dd5eccd5f1d6243e264dcf1db2670380b045dbfe9a4b761e31ce2dcf491d5"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.0/claudex-switch-linux-x64.tar.gz"
      sha256 "7b4cf44a2b33682b1f7dac7d04abb9bb190d40c7656e7a08d46c40b0d8d3dadd"
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
