class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.29.6"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.6/claudex-switch-darwin-arm64.tar.gz"
      sha256 "17229cccf589a4709955415d2b26e3238da74f8e04713bf0a097e5664f8fc6ec"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.6/claudex-switch-darwin-x64.tar.gz"
      sha256 "21322a1c7de6a075b5149ffb853179a8a9e7ad7f826dd672d219a7366320300b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.6/claudex-switch-linux-arm64.tar.gz"
      sha256 "afa63a54b7812f218346209497ae4c07b9d4466372de7b29efe4bf64afee88e9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.29.6/claudex-switch-linux-x64.tar.gz"
      sha256 "cb715ae2454fa522f8d5a3ffa54a7045bdd39df02f77f6906dff3c73bb7da500"
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
