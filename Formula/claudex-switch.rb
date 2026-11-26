class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.31.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "d49da5206c1432fcb09c8adc965cbe8e61c349bcdb65a567ffad1d6408f9ac3c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "7991986745686aa296b5d8bcc3d20902f9bb26cf37c0fc64eb84592012016ce8"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "3071689d8e0cb063e771c666d78f192165b8573943d08f52378ad954df189778"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.31.1/claudex-switch-linux-x64.tar.gz"
      sha256 "2a7cb86f32cc3c6ac246c7cfa063d0b6c3138fe707cf37a2d87d1680eb89b20e"
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
