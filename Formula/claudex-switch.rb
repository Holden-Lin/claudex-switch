class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.25"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.25/claudex-switch-darwin-arm64.tar.gz"
      sha256 "e33eb9ed140efab2718c7cc4f521586e832192c46a70493df4906bbed97b9271"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.25/claudex-switch-darwin-x64.tar.gz"
      sha256 "52d275e1980056377ffef73f789150c497c435dc6cc270790c2907e17386857b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.25/claudex-switch-linux-arm64.tar.gz"
      sha256 "19b0ff396810bccb0717c87e3a39c2665b5601540d609bfa1a5a0c456f2c9dc7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.25/claudex-switch-linux-x64.tar.gz"
      sha256 "15b5324c4633c0734053be5f273c328d4ce7c9b3bbc44772912e1a260662b81e"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
