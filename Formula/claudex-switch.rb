class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.3"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.3/claudex-switch-darwin-arm64.tar.gz"
      sha256 "c2fae0c42d42343e60fe4bb2e9c6bd7611ca48319cffc81efd84354fbee052e8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.3/claudex-switch-darwin-x64.tar.gz"
      sha256 "9d8253e1e846e2abc9732b02f7fffbf5c92d1fc6b11346f704cc3b68040e04c7"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.3/claudex-switch-linux-arm64.tar.gz"
      sha256 "ebd6d6377b8a39d012f13d69e6abe4b5e4489b6044bd5cc02b625dc6bc88b99b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.3/claudex-switch-linux-x64.tar.gz"
      sha256 "873201feaac8cb75f9d7a0b789e5e375b74259e5b5a8994c8d513c44cb70bb58"
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
