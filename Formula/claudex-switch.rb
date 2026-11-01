class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.12"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.12/claudex-switch-darwin-arm64.tar.gz"
      sha256 "2ebf96bdfd3b7deeed00324efe8963789d9098606aaf63de6208d07316b72e95"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.12/claudex-switch-darwin-x64.tar.gz"
      sha256 "5d87d6514038b082559146424e0656a73e8bda5d1954b007f156e91a88700836"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.12/claudex-switch-linux-arm64.tar.gz"
      sha256 "a02d54d53f9be511dcb735385ab499009992660ec3f34a61523ed93c86835597"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.12/claudex-switch-linux-x64.tar.gz"
      sha256 "10506bd5f4b6da5969127f0edd2557f6735187851d9e446927ec577eecf02e0e"
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
