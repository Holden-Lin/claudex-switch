class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "351b1e792bcc92fb1920b58c202c7bb6f9a95e82ceb2ec45c55c7ad8b944c118"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "1a39adb67ffa94892b01d766c03bca82d8ed5f2e311fa7ce5aff87c70fe275ab"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "6da3de80c48bc485aaf44d5eb68d48513a625f8f6aaf4681ab565484289d96d6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.0/claudex-switch-linux-x64.tar.gz"
      sha256 "eac94ba235096783e89d1861eeec452cd45e1f57d613140c81b3d8ca40e49035"
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
