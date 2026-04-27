class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.5"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.5/claudex-switch-darwin-arm64.tar.gz"
      sha256 "af6c237f6995648ab3ad83afdd46fcd34c5bfdfb37c99f9ded61781c58c93602"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.5/claudex-switch-darwin-x64.tar.gz"
      sha256 "c66e1498b4167af03d68c6d6a5d5c0718c1dad9eed5657670467aed764e68597"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.5/claudex-switch-linux-arm64.tar.gz"
      sha256 "a4217b477f515a741aea92f0817f0710157fa147545efb864eaa152363f7b6bd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.5/claudex-switch-linux-x64.tar.gz"
      sha256 "6c763c32acc137636cd8bc435fda4c4e9710eac7d2a1cf4bddd6d9a958f64a48"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
