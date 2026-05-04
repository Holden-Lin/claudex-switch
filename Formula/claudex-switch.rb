class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.14"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.14/claudex-switch-darwin-arm64.tar.gz"
      sha256 "ad04df94c9f7bad38c5ce59fef4f4fe662c26e7c7a0fb1dff41c0d225c86c79a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.14/claudex-switch-darwin-x64.tar.gz"
      sha256 "50b4f64d09cbce90afaf93fc2ad01aab5af4cb598c6b0d1275bf88a21eef32ec"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.14/claudex-switch-linux-arm64.tar.gz"
      sha256 "554aa2c86aba09919efc3bb5ea665af2599708caec2aab5871977e1a760485cc"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.14/claudex-switch-linux-x64.tar.gz"
      sha256 "835d3c3fafec97c23d125a0bf0f322a691a26bb1371d6502924fa7e36a54a0d8"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
