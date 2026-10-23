declare module "@magpie-community/opencode-cursor-auth" {
  export const CursorAuthPlugin: (...args: any[]) => Promise<any>;
}

declare module "@magpie-community/opencode-workbuddy-auth" {
  export const WorkBuddyAuthPlugin: (...args: any[]) => Promise<any>;
  export const WorkBuddyAIAuthPlugin: (...args: any[]) => Promise<any>;
}
