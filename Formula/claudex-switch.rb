class ClaudexSwitch < Formula
  desc "Switch between Claude Code, Codex, and OpenCode accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.26.1"
  # The MIT + Commons Clause combination has no SPDX identifier; see LICENSE.
  license :cannot_represent

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.1/claudex-switch-darwin-arm64.tar.gz"
      sha256 "817fe9a9823176f283339a38120546d655fc31d567d983668ca6f816ffc00547"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.1/claudex-switch-darwin-x64.tar.gz"
      sha256 "8c9b1817a4a57f1f21f99b6cfcd344b12df46e05a32f467125e14bb908f149c9"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.1/claudex-switch-linux-arm64.tar.gz"
      sha256 "b23074b3de9835e808cdf07d941bb781bb4052609ba426cda8061544d2451e55"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.26.1/claudex-switch-linux-x64.tar.gz"
      sha256 "03593b66f5fff341a410a1ba3c1a435da24514ae4ab7a35b8fe7a128cb1f1d66"
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
