class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.4"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "a88f07320d95f0722f05d0f99f6ba86c20a15b879f58586bbb82575f93bf61c7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "4adbfc55ec313078a9935bcc7ce6eb92145bcb9735938827d05dc52724bad14b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "0f7458505771ad6e6df9611eee1dc68eab2d0650c80a5d7a7708a47f419914a1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.4/claudex-switch-linux-x64.tar.gz"
      sha256 "de6edc343509a20be2f40eaf830a7f70c3ea3885cf2cd94ec2fe0fa6563a9c4e"
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
