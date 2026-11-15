class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.28.7"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.7/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f7c7e2020f9b2291bbbdd15ba45065edad351858a271c8fee4b207373cf498ae"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.7/claudex-switch-darwin-x64.tar.gz"
      sha256 "211a274711fe215bafcb291f8de7dbdc6d49c075a857dc556992aeb6ec66a9a1"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.7/claudex-switch-linux-arm64.tar.gz"
      sha256 "6bb50bb61bcb8bbf4c33ba7404d693641c3c326164bf376e3476af55405457f4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.28.7/claudex-switch-linux-x64.tar.gz"
      sha256 "d124e7debb136f19b6e0d09b82b4517bd217bced572e229de00060c5e8b9d68f"
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
