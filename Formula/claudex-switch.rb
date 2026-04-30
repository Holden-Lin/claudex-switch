class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.6"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.6/claudex-switch-darwin-arm64.tar.gz"
      sha256 "c7a410f0b989050aaa3792b9fb0d3dc158f536e02997476d5c077c8e2aab09c8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.6/claudex-switch-darwin-x64.tar.gz"
      sha256 "2335f695724c1c7bab7f892dc8306973f68c36d9daf983898ede1138bd00947a"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.6/claudex-switch-linux-arm64.tar.gz"
      sha256 "6b26219b39a1beb22f31b08a98b27df57bf4c6be71755ce03264c5f81ac4fd16"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.6/claudex-switch-linux-x64.tar.gz"
      sha256 "c1fdb94efe7961eb6003c02c84e5447e02270359ae12157e2111d86f6aeb078f"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
