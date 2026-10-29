class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.6"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.6/claudex-switch-darwin-arm64.tar.gz"
      sha256 "b9d2ff35705046b835048dac6e24de33c2efde827eed57d7eec3b2cb45fbf184"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.6/claudex-switch-darwin-x64.tar.gz"
      sha256 "12d453d8e94452468fd6360305c4f045b67f6575db9b849940529e10f838d34f"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.6/claudex-switch-linux-arm64.tar.gz"
      sha256 "349fb2ccfd229c95d0ad30ce9fece3b442a330f3908d361a5473b401995087b8"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.6/claudex-switch-linux-x64.tar.gz"
      sha256 "bf1ba2879797e5931223b5f366b4a2614a0cc8ba85be2f74673f709eae2ac609"
    end
  end

  def install
    bin.install "claudex-switch"
    (share/"doc"/"claudex-switch").install "LICENSE", "COMMERCIAL-LICENSING.md", "THIRD-PARTY-NOTICES.md"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
