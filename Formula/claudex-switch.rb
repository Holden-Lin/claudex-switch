class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.7"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.7/claudex-switch-darwin-arm64.tar.gz"
      sha256 "1506bbb6a0d90e0203f5a7ccf986cebf5c19e50f22938d89946041987aeb1fc8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.7/claudex-switch-darwin-x64.tar.gz"
      sha256 "0a3d43d895b2edfdec0097e70527945c315ab3eb638cf57a86107f026059aead"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.7/claudex-switch-linux-arm64.tar.gz"
      sha256 "1fd5b4b704f82c50acde14530384246ab05b78bcd1c9233b2631f1fb6a079b02"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.7/claudex-switch-linux-x64.tar.gz"
      sha256 "d989d4fa82d10944a6b31ed9be6cc0201624bdd1bda3e601964223f02e5362a8"
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
