class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.10.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "f23dcfdefa687dab2532a8ea3c75e65cea4921953fe511750910445461d408cd"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "253b07107abb80406bbd62079d5b9ec3acffc615b8e0934eb700687005599049"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "3e88d35f47ec4e565fce4b704612f25146eb17b3dd039818b507a8af1919ff8e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.10.0/claudex-switch-linux-x64.tar.gz"
      sha256 "493a27c90c42cbe6d73d511e40d30e4df327ff384cd2cbb5d97db664a167fa78"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
