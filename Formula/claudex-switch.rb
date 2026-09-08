class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.7.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "654e47d1966c0fff4fb86a86307584c46b10cb75b1c7fc530669aa0936e4ff1e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "0f8387d82305edbba9ad26e0ee5ed864f26332fccf9bf6b2f786b7b0a232c885"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "78faeab985d20c834f2e286e00f5b3a0b030ba203286c64808ebbaf9f2b30ffa"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.7.0/claudex-switch-linux-x64.tar.gz"
      sha256 "b1573d8e480ddb48aa82166c019abeea26dd1d92db712b050b547df63684dd28"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
