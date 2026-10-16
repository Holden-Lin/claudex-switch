class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.23.2"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "7894a724e4bebbb59c5ab09b66a9cc34f6c48881d66d005beec6a29ae81deff7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "c1bdc70e41738030e1b710cdec5361ff71d384ace7302c5f84a9ab406f9861fe"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "37615e50a3285c18d4d6a0dc386ef92f3161080c692d7b337a08bb75aa0c863f"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.2/claudex-switch-linux-x64.tar.gz"
      sha256 "68d0f39cc7dde533edcd99e8e5829f809c1428c18e1981d3d27af9c2ccd65fd5"
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
