class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.23.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "9f22a1d22ffee3ee1726aba32b9890655812aa32881b3ffbd8acb6e65e6fe235"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "27fd111ee7da7c258ca8e015c9329259414acaf55dfa82def6b07681d7ef0d7f"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "6786d51e09dc9acc95909815ca05ff569dcd479b4a0aace67c173665da11c2d3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.23.1/claudex-switch-linux-x64.tar.gz"
      sha256 "776827ec2c734b7cca9e8b5c9d04418784669b8bdb98eb6fb2285f8dc5164fc9"
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
