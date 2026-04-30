class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.8"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.8/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b3029e57e2d9af1ac08e77e315a2840aba92641997d923336080244ed24ce740"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.8/claudex-switch-darwin-x64.tar.gz"
      sha256 "e16130fd9c0798f857a634ee2f410dff6b16f2e2c91a9b00ff85542fd1fff662"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.8/claudex-switch-linux-arm64.tar.gz"
      sha256 "b7235f75c2e7b1dbddda15ed4e5deb2f599935ff4837eea15a2eabbe696803a1"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.8/claudex-switch-linux-x64.tar.gz"
      sha256 "090f7552be1b9338ce61c862f15dd3452fab651584605bef35ffd2abe5b861c6"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
