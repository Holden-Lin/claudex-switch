class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "be7bc4f35c478808cccfc55ef91e52f2c4daf83c7b36525bfeeb738b9dfdc4be"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "d8b314325cc64859d9585c81c2ee2ad3f8db5573e998f52e525c823a01a74695"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "edb4699bfe7437ff97e66ad30c5335ac3cc63a71ccef87fffd6deb2b99135c79"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.2/claudex-switch-linux-x64.tar.gz"
      sha256 "f2c203e8a543327bec8316e3871357d1db0f63bcb29d40fdded7ece65577d7fd"
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
