class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.18.4"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b26ad83df6fa0d1becf39f8f607ddc46652f335e59d8bb0aad2a4203dc7acd00"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "a2504e8e582d9476ff5cbde2460efd27fd68992b6ff0d425d4d42e427a801a6e"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "498e83adf3605a600fd0974f7a538c1f179bdb73e7711985363ea64789c52372"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.18.4/claudex-switch-linux-x64.tar.gz"
      sha256 "651e72f6985e8c0e2e1b65f8fc35820b50427451ee8e19e4ce7fc2fd4e8fdd41"
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
