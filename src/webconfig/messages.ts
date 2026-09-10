import type { AliasRejection } from "../alias/store";

// The alias rules live in alias/store as language-neutral rejection codes; this
// is the web UI's wording of them, shared by every web surface that can reject
// an alias (renaming an account, creating one) so the two cannot drift.
const ALIAS_REJECTIONS: Record<AliasRejection, string> = {
  empty: "别名不能为空",
  reserved: "这个名字是保留命令，换一个",
  charset: "别名只能用字母、数字、连字符和下划线",
  taken: "这个别名已经被占用了",
};

export function aliasRejectionMessage(rejection: AliasRejection): string {
  return ALIAS_REJECTIONS[rejection];
}
