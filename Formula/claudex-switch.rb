class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.28"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.28/claudex-switch-darwin-arm64.tar.gz"
      sha256 "9a595b8ed908ea93fe9ac16c6dba5aa1c4d0a43a978f350a60c3d676e3b7f043"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.28/claudex-switch-darwin-x64.tar.gz"
      sha256 "dfb7249e0a8979d34ea2c30b3eccc987abed9d01a3908b219c120b84ae1a684a"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.28/claudex-switch-linux-arm64.tar.gz"
      sha256 "347a805e0b851a82acd5f8e9e37a04f7784080835518cfa4a347b351262d9e23"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.28/claudex-switch-linux-x64.tar.gz"
      sha256 "a066c44f5ac8822f6530798843997655f2cc14c7810510ddc0bba3449df5bb77"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
