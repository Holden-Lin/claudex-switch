class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.19.0"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "38ebd4611f857c110b5e41614909828dcd2505752b65a8dc6ff88184e153d452"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "321edb0801626a5d5024ec71a5bd265e6c94b53cff90b9b4cb6330eaa7c7e655"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "9b17b96fcf05c2447517a97ab90a2291af7ebdcd2ef2698e1f7144f1c73a5d61"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.19.0/claudex-switch-linux-x64.tar.gz"
      sha256 "b39c91061d9489ed547fd9d8b548aef4764cdca22dc93f966b4bc90cecde7e3e"
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
