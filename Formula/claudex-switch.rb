class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.25.4"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "52f1933392cce235f646684d660ef3c3b0e27e4550c9ed5ed3ef01dba6ef46ac"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "a7ce1b4fb84d8088c5c8bff04b864c8f7b3c95542e75dd8008931e82aadb158b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "54af5d6257d109dc981f5e32281ae5dcb6943da571bc990e5dacb15ddc8842cb"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.25.4/claudex-switch-linux-x64.tar.gz"
      sha256 "691ebad806300dc39b46ed1f8dfe5b4df1febbee116af113fdc5bb5c299dc692"
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
