class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.24"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.24/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b489ee8f3c8153c13dcd83e663f4061633fb30aebc9edfa86dd2d2a74f40686f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.24/claudex-switch-darwin-x64.tar.gz"
      sha256 "e1f17cdd0243e34a38089138404a9dc948f85d5db4e4741db5087628f63b8df2"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.24/claudex-switch-linux-arm64.tar.gz"
      sha256 "2a3ac13162e7261aa11f743e61ba2f9b876a0bed78c707a5aa1fbd5104593403"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.24/claudex-switch-linux-x64.tar.gz"
      sha256 "004d49d20da5291f7ff558a87711fb6f67588770cf9a958d389135a1c62b83f3"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
