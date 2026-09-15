class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.12.2"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "259139bbc19dbdec9fbf60bb216bce5b150898fe044bbb5aead0c3333813b3fa"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "fd6409333bcd65e64f2bdff81424993ea0cf1c5354d83a0d0d9349ee31a4eee4"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "e914a28b7e48958bad594499aeb8970c946644157e5fb49e1cf1456891f1da90"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.12.2/claudex-switch-linux-x64.tar.gz"
      sha256 "7fb56895542e7b32bdb808429f83ca7e90ba775b7119f835a3e55920996d7efd"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
