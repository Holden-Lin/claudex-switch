class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.12.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "4438f8fd5789acdd22d11fe0d8f4295d123db4cb889343b9963fefd54727c08f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "c7ab0b8ac994e5343a3fd82ad68178dba2031fc8d44b20c7fe155940e12049b5"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "ca39b06fb7c60ae1569f8c9723dae56d66a844ff1c7d195591544df4331943b6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.1/claudex-switch-linux-x64.tar.gz"
      sha256 "f5f17275587fe874ce96726ca120ec5c965d8e35f18aee8e4207f57375094d18"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
