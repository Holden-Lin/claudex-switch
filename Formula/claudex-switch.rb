class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.10"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.10/claudex-switch-darwin-arm64.tar.gz"
      sha256 "8ed246ef585ae1b78696c636db9847ebf5662d8e98b6c48173f4a67cea76cbe0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.10/claudex-switch-darwin-x64.tar.gz"
      sha256 "97c5e888ac6b6c5149bd7040d907a745786af2adabc71e2e86c1bf014f354d06"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.10/claudex-switch-linux-arm64.tar.gz"
      sha256 "8fbe42bd88f5ec989cb1c3dde766580f2b080c3ebede2c7ee86e21c628784a9e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.10/claudex-switch-linux-x64.tar.gz"
      sha256 "bac15168adb2878b814d07783fe15e8a9acda7be21be6233eda022067c5d2247"
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
