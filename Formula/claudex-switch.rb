class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.22.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.22.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b36f81f9f976fbb5f1057cc156c848859682e2177c85e80ded8ff2287d3bfd3f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.22.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "02a324c64b02e88fcfb37e1db3f507119fc68b1fa60c225417b1a76ea26a644d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.22.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "4ad8c8735c1204241244547c22aaaa32f9f8f84c67ab28dc13d36ee3832c21c4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.22.0/claudex-switch-linux-x64.tar.gz"
      sha256 "720b8dbac452dd53a2a906776284ba2d25686a8937c47ca9dbc6ef03a739146b"
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
