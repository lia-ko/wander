import { toast } from "@/store/toastStore";

export function toastHttpError(res: Response, context: string): void {
  if (res.status === 429) {
    toast(`${context} — too many requests. Wait a moment and try again.`);
  } else if (res.status === 403) {
    toast(`${context} — request was blocked. Try again later.`);
  } else if (res.status === 504 || res.status === 408) {
    toast(`${context} — request timed out. Try again.`);
  } else if (res.status >= 500) {
    toast(`${context} — server error. Try again later.`);
  } else {
    toast(`${context} — try again.`);
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function toastNetworkError(err: unknown, context: string): void {
  if (isAbortError(err)) return; // silent — user navigated away
  if (err instanceof TypeError && err.message.includes("fetch")) {
    toast(`${context} — no internet connection.`);
  } else {
    toast(`${context} — check your connection and try again.`);
  }
}
