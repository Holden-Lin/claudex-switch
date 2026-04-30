class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.10"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.10/claudex-switch-darwin-arm64.tar.gz"
      sha256 "7f91cf2bdd2a8356dd9771f8f6cf1834d12781d9b1dcd8fb6df226ee89fc95f1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.10/claudex-switch-darwin-x64.tar.gz"
      sha256 "c2ad96ca88cf153c40f0fff83f00ffb0769072d118b5a9ddddf1d19e2c897474"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.10/claudex-switch-linux-arm64.tar.gz"
      sha256 "071155c643be313a8294a78f282b038e2ff53193e94fc9d4a85e3ff6b2319a3f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.10/claudex-switch-linux-x64.tar.gz"
      sha256 "20b2f69889f58aa1bd20fefe0acd0e147b58fbffa181e1db77e1106fddaa4242"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
