class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "af387540ca1ad47c281ae23a0822d7fc681f2651995395c150d956eb875a2982"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "640f74deef8619d0f2f6d84a1f3c2e6f1c4c54568af31bde0ed28242f5b49c1c"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "eb912d8585e72f2e67d007aa217b5b4a283edff930fe2898149281098ac916e7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.1/claudex-switch-linux-x64.tar.gz"
      sha256 "234d2355751a398caa4aa7a74f70f7183598540b2773b8fdf4bc98bea4098a4a"
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
