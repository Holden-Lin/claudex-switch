class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.8"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.8/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ed1a497676d92b9208bc7f61adff3a633d8970c23b96224b70dcc00e14eb3289"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.8/claudex-switch-darwin-x64.tar.gz"
      sha256 "6cd6ceb726d2e6b4bfb46bdc11364aaaf6feef6c3124718b6df7c38e66c885fc"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.8/claudex-switch-linux-arm64.tar.gz"
      sha256 "b42127347a62a76528ba8d577ff58b7e336fed0a8ff1641f9527c7f8e120c67f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.8/claudex-switch-linux-x64.tar.gz"
      sha256 "5b1436a7f01f4f5576b8b94f60214b27d42fb5eba0b897f786a869388ad1e218"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md", "THIRD-PARTY-NOTICES.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
