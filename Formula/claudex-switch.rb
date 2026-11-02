class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.27.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ae6e7092a44623c86e8a613cf0cca78659292e02dd69afe4885f53d4ad71c29f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "353c4875268304c178360068fef1bb5de8e247c8f45ac0c404937b8af3987098"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "220ee2ab51104ebd3841b8940ab096386b0c805067c10fc225efe6364b69c666"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.27.1/claudex-switch-linux-x64.tar.gz"
      sha256 "ec5c3cc761cd481b862f5e912cbf0f6044ac1e7641ff90dadf7a1b17a687d751"
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
