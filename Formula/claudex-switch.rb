class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.8"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.8/claudex-switch-darwin-arm64.tar.gz"
      sha256 "865c54f2927178da099820dc4ab784188b4ea5eec0527f26d38dde55635833e6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.8/claudex-switch-darwin-x64.tar.gz"
      sha256 "fce67f2d7928bedf6d9d06e348844ef6d058d339d0635aeb286dfc86f22aaaf6"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.8/claudex-switch-linux-arm64.tar.gz"
      sha256 "5db840db6c36c2a9642d198d197c946a514cdd0ce3e277013bd2b8d9791414b7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.8/claudex-switch-linux-x64.tar.gz"
      sha256 "735a3f010848217bd4a1502473ab984ae558892b7d396350748642524cb3fa49"
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
