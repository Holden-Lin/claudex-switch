class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.9.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "465a085ff128a3586471fc972b0d85913161b6a408a1b16a4d4f10e3d811c363"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "55d2d99e815c879e46fb51714199e547deeb28170e3ecc6ce0440f917aae200f"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "ffed08dadcd6bdb357bd99059f11902ae13970a58a35bdd4d4158abe7030b47e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.9.0/claudex-switch-linux-x64.tar.gz"
      sha256 "a01dd4c050b15cf7dfe324ca156e87e5b0ce1e1a7d96e6e6ac916ac40b8e45ee"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
