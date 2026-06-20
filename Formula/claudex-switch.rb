class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.23"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.23/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ae4703e1fb7458b4688c38494f106c158ecaf66dbf89426aee2ed9ec46cd4da2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.23/claudex-switch-darwin-x64.tar.gz"
      sha256 "96ceaec7ce9abbee55be84a20b708eca42281849cfc4950abc45911a2ab9df42"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.23/claudex-switch-linux-arm64.tar.gz"
      sha256 "d5350b8c6e3a5594c37b85f9196fb3d7c1d80ec156c8f3a4735595bb6864b33b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.23/claudex-switch-linux-x64.tar.gz"
      sha256 "703766d90ad65e7170b15148954f750eb8dc1ff70e263c8f97c5482ce28a6953"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
