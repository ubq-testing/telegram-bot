import { Update } from "@grammyjs/types";
import { Context } from "./context";

/**
 * Typeguards are most helpful when you have a union type and you want to narrow it down to a specific one.
 * In other words, if `SupportedEvents` has multiple types then these restrict the scope
 * of `context` to a specific event payload.
 */

/**
 * Restricts the scope of `context` to the `issue_comment.created` payload.
 */
export function isIssueOpenedEvent(context: Context): context is Context<"issues.opened"> {
  return context.eventName === "issues.opened";
}

export function isTelegramPayload(payload: any): payload is Update {
  return payload.update_id !== undefined;
}

export function isGithubPayload(payload: any): payload is Context["payload"] {
  return payload.action !== undefined;
}

