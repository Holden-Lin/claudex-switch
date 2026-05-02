const userAgent = process.env.npm_config_user_agent ?? "";

if (userAgent.startsWith("npm/")) {
  console.error("claudex-switch does not support npm installs.");
  console.error(
    "Use: curl -fsSL https://raw.githubusercontent.com/Holden-Lin/claudex-switch/main/install.sh | bash",
  );
  console.error(
    "Or:  bun install -g git+https://github.com/Holden-Lin/claudex-switch.git",
  );
  process.exit(1);
}
