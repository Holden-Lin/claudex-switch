#!/bin/sh
# Read-only repository audit. All source, generated fixtures and Go caches stay in /tmp.
set -eu
mkdir -p /tmp/claudex-protocol-ab/old /tmp/claudex-protocol-ab/new /tmp/claudex-go-toolchain
curl -fL https://go.dev/dl/go1.26.10.darwin-arm64.tar.gz -o /tmp/claudex-go1.26.10.tar.gz
printf '0b5183492292ada170f9b561a834863808dd02edba599e4ad0e89899330020b3  /tmp/claudex-go1.26.10.tar.gz\n' | shasum -a 256 -c -
tar -xzf /tmp/claudex-go1.26.10.tar.gz -C /tmp/claudex-go-toolchain
for version in 7.3.15 7.3.20; do
  curl -fL "https://codeload.github.com/router-for-me/CLIProxyAPI/tar.gz/refs/tags/v$version" -o "/tmp/claudex-cliproxy-source$version.tar.gz"
done
printf '5a6fc5058ca443d046e01b92e730707838975d56e34ef995cca85b01435d6e60  /tmp/claudex-cliproxy-source7.3.15.tar.gz\n5ec1a413d49820a10ead8f6e04ad5417e35177667547c5a00496ac683db900e2  /tmp/claudex-cliproxy-source7.3.20.tar.gz\n' | shasum -a 256 -c -
tar -xzf /tmp/claudex-cliproxy-source7.3.15.tar.gz -C /tmp/claudex-protocol-ab/old --strip-components=1
tar -xzf /tmp/claudex-cliproxy-source7.3.20.tar.gz -C /tmp/claudex-protocol-ab/new --strip-components=1
# Copy exactly the five upstream new regression functions into old temporary source.
bun -e '
const s=await Bun.file("/tmp/claudex-protocol-ab/new/internal/translator/antigravity/claude/antigravity_claude_request_test.go").text();
const start=s.indexOf("func TestConvertClaudeRequestToAntigravity_NonThinkingClaudePreservesToolResultAdjacency");
const end=s.indexOf("func TestConvertClaudeRequestToAntigravity_ToolResultName_TouluFormat",start);
if(start<0||end<start)throw new Error("Exact upstream regression section absent");
await Bun.write("/tmp/claudex-protocol-ab/old/internal/translator/antigravity/claude/offline_adjacency_regression_test.go", "package claude\nimport (\"testing\"; \"github.com/router-for-me/CLIProxyAPI/v7/internal/cache\"; \"github.com/tidwall/gjson\")\n"+s.slice(start,end));'
export GOPATH=/tmp/claudex-go-work
export GOMODCACHE=/tmp/claudex-go-modcache
export GOCACHE=/tmp/claudex-go-buildcache
export GOTOOLCHAIN=local
# Old tag is expected to fail four cases and pass one.
set +e
(cd /tmp/claudex-protocol-ab/old && /tmp/claudex-go-toolchain/go/bin/go test ./internal/translator/antigravity/claude -run 'TestConvertClaudeRequestToAntigravity_.*PreservesToolResultAdjacency$' -count=1 -v) > /tmp/claudex-protocol-ab-old-results.txt 2>&1
old_status=$?
set -e
[ "$old_status" -eq 1 ]
(cd /tmp/claudex-protocol-ab/new && /tmp/claudex-go-toolchain/go/bin/go test ./internal/translator/antigravity/claude -run 'TestConvertClaudeRequestToAntigravity_.*PreservesToolResultAdjacency$' -count=1 -v) > /tmp/claudex-protocol-ab-new-results.txt 2>&1
(cd /tmp/claudex-protocol-ab/new && /tmp/claudex-go-toolchain/go/bin/go test ./internal/translator/antigravity/claude ./internal/translator/common -count=1 -json) > /tmp/claudex-protocol-ab-new-full-results.jsonl 2>&1
