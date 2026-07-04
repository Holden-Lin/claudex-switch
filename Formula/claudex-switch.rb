class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.30"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.30/claudex-switch-darwin-arm64.tar.gz"
      sha256 "836c17f4667268f625eb716b1f9638975f62410f50825f808cfd9907c0be2435"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.30/claudex-switch-darwin-x64.tar.gz"
      sha256 "17f95143998e7c55c93b6d448726f91b7260d8e47de5c831144085738d28f2f8"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.30/claudex-switch-linux-arm64.tar.gz"
      sha256 "6e7bb604ba6dfa06d1a777f506dffbd654bd2a7e3ef88df372d0551c164ac07f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.30/claudex-switch-linux-x64.tar.gz"
      sha256 "346ae7b7cbd805fcd6adf5af040f382f554ad2cd2d1585711a714c97c213a6f8"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
