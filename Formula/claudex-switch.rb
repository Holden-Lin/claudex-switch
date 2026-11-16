class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "3254a2e4ab38e277faa11a7c85a3f7028afa3e076c934d12c82aa58ae3ce36d6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "aaa050b3cda88f5bb7281d442a7f7a7a9014ac50f19df0fa848e270db9e93bb1"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "2d76241965296096e1a19541dc809f0be12de3463150961bae43a647914a0236"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.0/claudex-switch-linux-x64.tar.gz"
      sha256 "4f5118ee4ec9219e84da9866477802a3f877c86ab62dd5e382389d327a55bffe"
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
