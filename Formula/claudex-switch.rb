class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.4.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.4.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "2cbe7382455ff27c721f8fbfc8b2c144f90ab82c525c574c7c13634c32ff5637"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.4.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "df54367d5191fe86e64e6ebee8ee406525fc8d20caba8cf70e2c69b7df68041b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.4.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "1b632dcf6a6f73d62ca390f726196f25945c5483a1f22c4a9a431e8b59d40022"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.4.0/claudex-switch-linux-x64.tar.gz"
      sha256 "2b76732fbd210ba9b73556f80476b328c87cb7a1640a48ae9d7b9c9ff6bb08d8"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
