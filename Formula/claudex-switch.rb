class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.33"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.33/claudex-switch-darwin-arm64.tar.gz"
      sha256 "4bcc7e5eccb837a22a4d938329f3dc2e3bd3a52cbddf293304dbabd7966d2857"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.33/claudex-switch-darwin-x64.tar.gz"
      sha256 "d5d8cf9d885895bb8caa712f50fea816486745a73abfe9426182aa5b41cc792b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.33/claudex-switch-linux-arm64.tar.gz"
      sha256 "44728b6aab022c865014077f21bbce4af2810135e7b0bba97759b4bd9c2a1b77"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.33/claudex-switch-linux-x64.tar.gz"
      sha256 "c9e625fbcd9c9a71379be65d3ecbb69cad94adee31cc6b6c6dc99668d479a58b"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
