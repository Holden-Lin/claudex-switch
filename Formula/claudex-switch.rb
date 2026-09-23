class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.12.3"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "434ea3ff20d540f822a3bdab75c1e4b0fe5a02add36177ca5f1d032c9958ecf8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "2e085a1b38c516dc5791b33059fdd86acb8131799aff14af7caf3878807fb918"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "c351fba2ff48303f8ef85befe3a5fdcb8e150eeaaed1f6d39a270d89b52614b3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.3/claudex-switch-linux-x64.tar.gz"
      sha256 "6faf2f52251efc1b055542a5ad1b93e953b5ec847e8f04939da193f5bc8935e6"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
