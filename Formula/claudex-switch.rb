class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.4"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "2f4ed09d73891c07d383ff8aac71e2f1f6b75208aa085886684226212e9ac115"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "7e0bfdcb71fea1c7607840d88ece4fa39636c79b4cc3df6c1ff1dca4ecdd2982"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "a6a8dcd8cf1414cf505e2fedf9fde070448eb530030a7477a61f3029773843ac"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.4/claudex-switch-linux-x64.tar.gz"
      sha256 "eb54fd72cfa96b7735bd06ff671f9d30220b2a8da7be076f43844c4dd808505c"
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
