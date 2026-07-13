class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.32"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.32/claudex-switch-darwin-arm64.tar.gz"
      sha256 "44191bcd4e3e2d3e4f1d6706a566d675bdc4f050e8e3eec78e53b65c377613ba"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.32/claudex-switch-darwin-x64.tar.gz"
      sha256 "45a5f08406f434f86ec2da510ad4f993d86a0bc916b6aad524656789f0db277d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.32/claudex-switch-linux-arm64.tar.gz"
      sha256 "282bf084738d9c9c663f2c5fc8f1e69df7d79c5206a73237823b3f727fc5ad11"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.32/claudex-switch-linux-x64.tar.gz"
      sha256 "65bc6372bdb388210d06f0eb7e8fe4bc7b4fc707de028c2c655c45b6ec8516a4"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
