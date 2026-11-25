class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.30.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.30.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "96fcb7b94a31b0ad86d8d9ae266d68de3826fc1dc6247f48da06682a86d1cfb8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.30.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "4a1adb50b376de2e19532f444779d242f60ea76e28aa9df4f0821afd13b38e21"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.30.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "9daa00802ef80266e69cc707b6823a5eca5f1f606f86ff2a9e648d6b2e401ad2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.30.0/claudex-switch-linux-x64.tar.gz"
      sha256 "85f4c6e1406d593875044003eab0cd0b5c7649705c684c7bff1995650a7037c4"
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
