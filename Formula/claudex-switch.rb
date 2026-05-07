class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.20"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.20/claudex-switch-darwin-arm64.tar.gz"
      sha256 "15564d058554053318af32b45811bb71618fefc4ee74fa3712276ea69878b945"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.20/claudex-switch-darwin-x64.tar.gz"
      sha256 "eee4f88b402ffa45c929a2e86513b5a6b9957a1b4f9328a3e4873a8505c9c409"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.20/claudex-switch-linux-arm64.tar.gz"
      sha256 "a6055965c7190363de38726e969030ac068127ba1e13a7a89ee5a4f6d84ca982"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.20/claudex-switch-linux-x64.tar.gz"
      sha256 "8b003a00c5f9bc0c106b7bc0a0fa5452a0dc4fb14b9aeec39981cf7b955dfb60"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
