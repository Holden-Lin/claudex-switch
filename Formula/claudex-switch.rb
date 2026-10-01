class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.15.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.15.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "9f1292af7a33c58a42e9ba00c9dc7cbbd9639dac28fe28527cf99652c803ea65"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.15.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "a8c751dd1d0a63d930b5e480473f313ea00c331cf220e4cbb95bc4dd697e2720"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.15.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "5d301dc301c9570b6a4edd1ccd941abd961236f1cd5878a5982b5cd9a9dc9203"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.15.0/claudex-switch-linux-x64.tar.gz"
      sha256 "30e36acfe294558a6764cc08904e7fb94247aa0c95a5e865a0688750ecc5583a"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
