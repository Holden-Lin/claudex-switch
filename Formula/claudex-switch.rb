class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.13"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.13/claudex-switch-darwin-arm64.tar.gz"
      sha256 "8cb37705920628f27248afc30f51927a3ef42e1537d9e5119d083376da500b6b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.13/claudex-switch-darwin-x64.tar.gz"
      sha256 "545d2ae11a8852340f63a1e01e7634d06a595cd1e3ca472366601f3039b9f915"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.13/claudex-switch-linux-arm64.tar.gz"
      sha256 "87ac08f899dd512118b7d0caeff97cabf0f3534dad58b26aee464300a4ad92e2"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.13/claudex-switch-linux-x64.tar.gz"
      sha256 "6d9f139a69d33c779eaf22b373f6a410f644d207f44d917c62c579d9b86c27a8"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
