class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.12.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "296f1ddffb6ad165b837584347e6debedfe15035368ca7d177f7f43b18ea7fa9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "11759f5c7df052e7e9c35e159d5d3c27c5b91f8d2337525c6ea92a2336fa2e87"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "d020b2a109b0d844d4dad85f26284ef1b31a3b43e770a1288d500418d82bcb7a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.0/claudex-switch-linux-x64.tar.gz"
      sha256 "dd245123acfe2c1b899a6793e285eccf0e2d20f4c3f1f9069a3967d07b0b8b2b"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
