class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.15"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.15/claudex-switch-darwin-arm64.tar.gz"
      sha256 "623ef156b3ccbd7ca3836332b93544e214002ad84f94379556a9f052e884dcb3"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.15/claudex-switch-darwin-x64.tar.gz"
      sha256 "a7a775c6b481fd35eaa458cf6cc23956c2fe6df33d0e44eb5d051f7013d3e71b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.15/claudex-switch-linux-arm64.tar.gz"
      sha256 "9e619553da34a50c0f1896e0253e5bba14126985414726e74ef6968ca6ef5183"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.15/claudex-switch-linux-x64.tar.gz"
      sha256 "5d4562a30d359e3f43ac05039c30adf34db04136b559bcb4e6a9e5cdfea12798"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
