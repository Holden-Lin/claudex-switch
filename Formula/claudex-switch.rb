class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.17.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.17.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "0416c2b6974d1c8c89fa157daf855020bde49dee497b609dd2681af7d39b92f1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.17.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "4dc9d11b1cbdf4d4612009467cd1356a03370ae71ec4aebccbfdbfed7dc2706d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.17.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "d137bc71175d22bc9f67b60e7a4149528da31e7a47a89ba896e35fe0aac2e188"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.17.0/claudex-switch-linux-x64.tar.gz"
      sha256 "f0948d02c1750bc11eee319f8d6421329ad52e42f581a173700c0551743c4dbf"
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
