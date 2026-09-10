class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.9.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "50eb92ee1d031ed418d335bcf8122aeed2f7cda9a897f6c0dceb3ec9149f1a12"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "3392f36205becbc85ab59b59a6cb927d4561d3271a2ed6dca57debb1652d0020"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "035317579c751b61357e540177bc9f1b8bf40d74a31d54c6cd4191933ed22a22"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.1/claudex-switch-linux-x64.tar.gz"
      sha256 "7b278a33d7d881fdc17aeec7a98c64b016682258fb33cc75489f6e66eee91ef0"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
