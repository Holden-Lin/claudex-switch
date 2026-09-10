class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.10.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "d7e4b5a56dfd212e8f70dd4c771a5d93bb89505c2972041d3a22d673f226ba83"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "c99af01eb65542660f424b09cc28943ec56ba6d6119cb6eb90b1e20af24ae088"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "48c81632fc31da35ce6eff4182d08bc10b8be0c98c93c6a9dd285a2dfce44ec7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.1/claudex-switch-linux-x64.tar.gz"
      sha256 "b9f13ad40c9ca691962fe36c65d3d21252b1e3806a41f2e689afd0b864650a7f"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
