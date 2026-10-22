class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.8"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.8/claudex-switch-darwin-arm64.tar.gz"
      sha256 "3ef1a7c3857c9f0479de88ada0fd74207417c8584bfa9998c9f6b742e06adba7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.8/claudex-switch-darwin-x64.tar.gz"
      sha256 "e429c2126b4bfb4dde2c25640cf7775fbc928f87e73427c3d259c31a79b86a68"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.8/claudex-switch-linux-arm64.tar.gz"
      sha256 "a2566ca3a8184e216e72243f6b8a80794d89da0ff15961437090abe2062abfdd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.8/claudex-switch-linux-x64.tar.gz"
      sha256 "bf5010b3fc18150d34d4063184369d6c159e6bbb9ca251e16a26a0828a991ce5"
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
