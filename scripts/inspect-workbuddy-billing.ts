/** Read-only billed-model check; never starts a model request, proxy or login flow.
 * bun scripts/inspect-workbuddy-billing.ts workbuddy 2026-11-10
 */
import { loadAliases } from "../src/alias/store";
import { getProfileData } from "../src/providers/claude/profiles";
import { cliProxyAPIProfileDir } from "../src/lib/paths";
import { listSubscriptionBillingRecords } from "../src/providers/subscription-plugins";

const [alias = "workbuddy", date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date())] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) {
  throw new Error("Date must be YYYY-MM-DD.");
}
const entry = (await loadAliases()).aliases.find((entry) => entry.alias === alias);
if (entry?.target.provider !== "claude") throw new Error("Expected an existing WorkBuddy Claude alias.");
const profile = await getProfileData(entry.target.profileName);
if (profile.type !== "local-cliproxyapi" || (profile.upstream !== "workbuddy" && profile.upstream !== "workbuddy-ai")) {
  throw new Error("Expected an existing WorkBuddy login.");
}
const records = await listSubscriptionBillingRecords(cliProxyAPIProfileDir(profile.profileId), profile.upstream, {
  startTime: `${date} 00:00:00`, endTime: `${date} 23:59:59`,
});
console.log(JSON.stringify({ alias, date, upstream: profile.upstream, firstPageLimit: 50, records }, null, 2));
