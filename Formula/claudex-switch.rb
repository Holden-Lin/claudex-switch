class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.9"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.9/claudex-switch-darwin-arm64.tar.gz"
      sha256 "100463c99f766e1ac6510f0d7e2bb689bc3d0e04798c4be05e1a6943a55d3d1a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.9/claudex-switch-darwin-x64.tar.gz"
      sha256 "eab257d40d76273e0148242aa78d38c8faa597749cd181a35dc06fd014ddc1fd"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.9/claudex-switch-linux-arm64.tar.gz"
      sha256 "8159950f55b1b2a51d00e9b7a3c289ab9d9c350d92b8777a59303db0fee207e1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.9/claudex-switch-linux-x64.tar.gz"
      sha256 "030eca1bd79348a529ac62703818a606a3753e87b963a883d7ed4dd0a99d91e5"
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
