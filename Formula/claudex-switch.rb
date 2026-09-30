class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.13.2"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f533c29291c29aa16ccb3d5a2b1335fdc2e0f83a92baec8fe3c7bd17431e7a9f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "b1112f2cb213c3ec285406fcd092013135a9d6531c4c8b21334a87d75309e1db"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "77c26727366820e040ac267125b6f6e118c0516dfd831866d4ae6022a2fd16b2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.13.2/claudex-switch-linux-x64.tar.gz"
      sha256 "d66a960a3e9a9451143a6042713fd4523c6b66330d277925c58751146e65a3c7"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
