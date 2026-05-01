class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.11"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.11/claudex-switch-darwin-arm64.tar.gz"
      sha256 "4e4958392a368faa80b559d1b3fa7626317e5e5c5ac80e043d580ee1ad603d55"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.11/claudex-switch-darwin-x64.tar.gz"
      sha256 "d2e2c95be2e952b2395e1e7f6fe297a48911825d2ce143610bbf0ad7711e3408"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.11/claudex-switch-linux-arm64.tar.gz"
      sha256 "72b62c7a3067001adbd10a20119cf16ab1826742ce6e92ec727adc32eb29387a"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.11/claudex-switch-linux-x64.tar.gz"
      sha256 "526d1192b61a6abe33d62a8f562f3b6b0c38648ec274b252f01adf851bcbc2e2"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
