class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.4"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "1b17173378eb2f2c2f999a6bb4825c6d7ccbe45bda7327c5a03578aea7eb5c10"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "10803484101ee8a7053cee30697c281ecfabdaf0756c95819ce18eec2f274a84"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "a37dc1593a227aa792746b52f20906dd2bfd286c50d093ff27575540bb19ad37"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.4/claudex-switch-linux-x64.tar.gz"
      sha256 "b4f5316b07f215461b424e8f8a35b259da8232575ac1249117876b8726d5d5af"
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
