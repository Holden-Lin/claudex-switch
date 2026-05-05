class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.18"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.18/claudex-switch-darwin-arm64.tar.gz"
      sha256 "5f148c8be528cebe5eb098f44f106cdcb6ecfcaf892897b3e3a9145aa10c1cf4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.18/claudex-switch-darwin-x64.tar.gz"
      sha256 "f7df78c3a88d46d353ce7810dafc728a08590f50e66ce44e80af814c4abe6360"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.18/claudex-switch-linux-arm64.tar.gz"
      sha256 "5af287f6d553afc5e3f2e8313d13bb738f8a3b9b6d6e1308af914e8402fe500d"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.18/claudex-switch-linux-x64.tar.gz"
      sha256 "96ed02a0e356ad427328b5bd3b702d4efa2224b3e92295f6728bf9286f1a3481"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
