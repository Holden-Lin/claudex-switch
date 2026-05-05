class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.16"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.16/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b58ec8fcbf17df5d6f6a85872af23e56c88a458f05b6789ccfca4e7f556ce8ae"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.16/claudex-switch-darwin-x64.tar.gz"
      sha256 "a14b569c93e0d7dc13a44fde7fe13422ca5755204bddce9be09f0f62d05c6039"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.16/claudex-switch-linux-arm64.tar.gz"
      sha256 "9941342a4e334e66850cab916cc9f3afdb15a9abcfb6bddd884224da7fffe916"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.16/claudex-switch-linux-x64.tar.gz"
      sha256 "d0fa0f5a08d7d09b31c81ebe5d76c414e3c68c890541ef21308e579017dfadc0"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
