class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.26"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.26/claudex-switch-darwin-arm64.tar.gz"
      sha256 "225ccd255a9822297273fcd5d2bb1a9ef91a577c703ef09a5e3b23c772ab964e"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.26/claudex-switch-darwin-x64.tar.gz"
      sha256 "93cebfeaacb1064d46b44e8723b8828fc9067768ad791b317019c0ee9dfe893b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.26/claudex-switch-linux-arm64.tar.gz"
      sha256 "942eaa3433d8d80405d8d9acc34d7f7ed047a0280c7d115f96133f7a6fefa514"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.26/claudex-switch-linux-x64.tar.gz"
      sha256 "199b4d42db32f15cb890868bcbf0f6e4d132216e4e35cafa39f8afec34a2787f"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
