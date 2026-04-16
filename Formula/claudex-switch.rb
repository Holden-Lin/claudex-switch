class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.4"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.4/claudex-switch-darwin-arm64.tar.gz"
      sha256 "c039e888bd7f4326a49c343727590ece6efba896267b0835f1850a8922a65db4"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.4/claudex-switch-darwin-x64.tar.gz"
      sha256 "d9eddd1f829c2edec06ef2a6f0b230f8e8d376db4900e4e71f65d8deb0e3436b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.4/claudex-switch-linux-arm64.tar.gz"
      sha256 "a20bfd2f2d579259edb8505e89e38e5eab320a200a1cfb5772d7f90710a013f0"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.4/claudex-switch-linux-x64.tar.gz"
      sha256 "f7dd0305f90b6f99617d3e7334d4b283df3ee3ece5cd1ddae7c5b453c7e6a28d"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
