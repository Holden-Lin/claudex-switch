class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.19.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "44fd774073282daef7003808a25474956a230ec978501f99522ead7a7e8a6964"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "b706ff6bef53998e66b7e2506fa21acad1e3d9e52df3a56da37229f3511ac2b9"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "bd79b19d6ee954db6b999c69561aefa353cf86c9d3faa041516af41b7bc247e4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.1/claudex-switch-linux-x64.tar.gz"
      sha256 "ff77508b886ee9527db94db2fa04ca86e00cde93467e18b49e4573b8052b2e32"
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
