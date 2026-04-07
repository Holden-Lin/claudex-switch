class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.1"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f450ffc8ed58fe0db18a21313c0db61b1c48d60d86a3614e14c030f34f1092b8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "883b00ec22d29c83cfc067093e6ddb79b802951a70e134b8f66af7c0691f6d9f"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "e08f2f80bf2e8a83d107607bf797ac5af3ab2726f277fed320104adb00b725a3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.1/claudex-switch-linux-x64.tar.gz"
      sha256 "9d227d589f08e3d4d4d1dc4c267ff85cbadf96d3d94c954adf4a9394fdc479a3"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
