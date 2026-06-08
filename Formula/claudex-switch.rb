class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.22"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.22/claudex-switch-darwin-arm64.tar.gz"
      sha256 "90dea3a51e882a469903ed44517be69f04db6c3e82593a385ab92165d3c80553"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.22/claudex-switch-darwin-x64.tar.gz"
      sha256 "b2e83ee1e2d8f72d6ba567bfb9129583f625a506d1c624f35fef02d0121b717b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.22/claudex-switch-linux-arm64.tar.gz"
      sha256 "0a43d7fb238e13224221b0710727fbc7b99a84b327c04c6371af36f641db0a09"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.22/claudex-switch-linux-x64.tar.gz"
      sha256 "bcfaaebedd3c093cbe0642a39abdb2a40c6bedba0dbb4d8dcab2d10268ecf543"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
