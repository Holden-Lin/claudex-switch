class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.18.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f93d4095c0456b8b084fce4cee1a93714b64294716868951e5115111ac0349e5"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "0d1967e79b9ab3e4263843ad222fae6cd2603deca69cea2fbdd4c9ee3eaceb84"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "ddc3f29bdac7d85ace7306ba52d453017f7d09b3902b93470ba6dc4f7b8cc93d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.2/claudex-switch-linux-x64.tar.gz"
      sha256 "f42d520ac2e694699c6218cca63252939cab9df4bba2e0911d0761a816334db7"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
