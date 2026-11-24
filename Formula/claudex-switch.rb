class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "5492eeac3424a5aca841e184d4869487ae73017ec4fc35dfbf0b169157692ffd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "7900d554797239d02d2717ac3a1bf9a6349cf63ddacc68cc2e311a7a2c042383"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "8da5477ee9413d8adc38e0665bec9d98a7566282c987b23971141dd41288efe8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.3/claudex-switch-linux-x64.tar.gz"
      sha256 "02a15019b641e9484e2dc33a3b21eb7dc28667b36ce7cdbabc2fedc8841496b5"
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
