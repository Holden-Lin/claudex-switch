class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.20.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.20.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f5064e961666f4a4bcad8e6dce5d3a42be51e451e540168ae68ee0d26fa644d9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.20.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "9741407ce954bed8a38079bad7602be0984155db99b4043b3a42d58c7207a893"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.20.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "ac13b866e97f40e0a9b9047cfa685ff30f45264af66a17f75d87065dc84ad411"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.20.0/claudex-switch-linux-x64.tar.gz"
      sha256 "c65325548a2b203129c205ecc2eb694c41a4cfae14d4035fe2e6e781a205c8eb"
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
