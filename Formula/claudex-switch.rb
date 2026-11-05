class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "384f1845174ba728be32b7c95c6bb4eb81bd5b81a5ba05f2e1dae3f69a5ad640"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "08a52cde14660b154f572d72b47ee70187e409efb919aacb7ef385ffd977d9d5"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "cdcad1c21086f48e528af640a0f1f681b5bb794fb501cb2baeb5d699869ac1ac"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.1/claudex-switch-linux-x64.tar.gz"
      sha256 "26389585613dab5a6ceac430ece91dd96232feb186b8ca73ac90d7b77fe45214"
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
