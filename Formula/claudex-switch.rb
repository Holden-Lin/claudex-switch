class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "40111bdf87dc8c2b2bc364ac03733bc76157b84b2269d784ac5980d5f0a952e4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "eb7ffc72e775bb66b8b09768791878aa6a18d767cfc6f45d014fa42c7f385c4c"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "6285c08f39027687fb36dec3cce4fd363a35766b8d2c714534791586e5c1f41c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.2/claudex-switch-linux-x64.tar.gz"
      sha256 "76b222fbd9714fb34b48092af47e92f7d775bf824b854be48978a66e3cb211b5"
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
