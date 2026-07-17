class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.2.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "490979907afa508469e483eb566666f2c31171f3602da720a5c2608dec657aeb"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "c8c29cfa381cdc3a412820efe571a0c31a324ead5aeb1946f7cdf8434daf4650"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "4818b7d550cfe872a1f247f93b1c6be315e8636a3c5c72ced984ca47572de82c"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.2.0/claudex-switch-linux-x64.tar.gz"
      sha256 "a5dfe9d325d1afdb7e08994b216e464ce4cb08f74aae0ad48049337c24af1aa7"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
