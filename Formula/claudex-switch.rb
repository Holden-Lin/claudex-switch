class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.7"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.7/claudex-switch-darwin-arm64.tar.gz"
      sha256 "da7e2ca1c70928ae49205df7a28dd8a3d85897ffb37a94a74e37f8060c99c0fd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.7/claudex-switch-darwin-x64.tar.gz"
      sha256 "145f50f0dfe73347e7be2e73af95b5203960c110b1549c709a3ddca4000cbe53"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.7/claudex-switch-linux-arm64.tar.gz"
      sha256 "3cc93a28eed8f07501f67a074c77a7357635d5c797283fe38a057bacb54e4f3a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.7/claudex-switch-linux-x64.tar.gz"
      sha256 "3d057f63f5de44700b580595573b413e1facb953a2421c7cc51769810eace02b"
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
