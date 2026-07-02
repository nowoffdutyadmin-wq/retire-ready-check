type ErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

type ZodIssueLike = {
  message?: unknown;
  path?: unknown;
};

function textFromUnknown(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const maybeError = error as ErrorLike;
    return [maybeError.message, maybeError.details, maybeError.hint, maybeError.code]
      .filter(Boolean)
      .map(String)
      .join(" ");
  }
  return String(error);
}

function tryParseIssues(message: string) {
  const trimmed = message.trim();
  if (!trimmed.startsWith("[")) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? (parsed as ZodIssueLike[]) : null;
  } catch {
    return null;
  }
}

function issuePaths(issues: ZodIssueLike[]) {
  return new Set(
    issues
      .map((issue) => {
        if (!Array.isArray(issue.path)) return "";
        return String(issue.path[0] ?? "");
      })
      .filter(Boolean),
  );
}

function messageFromValidationIssues(message: string) {
  const issues = tryParseIssues(message);
  if (!issues?.length) return "";

  const paths = issuePaths(issues);
  if (paths.has("title") && paths.has("audioUrl")) {
    return "Please enter a session title and full audio URL before saving this day.";
  }
  if (paths.has("title")) return "Please enter a session title before saving this day.";
  if (paths.has("audioUrl"))
    return "Please enter a full audio URL that starts with https:// or http://.";
  if (paths.has("durationSeconds")) {
    return "Please enter the audio duration in seconds. For 10 minutes, use 600.";
  }
  if (paths.has("dayNumber")) return "Please choose a day number from 1 to 28.";
  if (paths.has("name") && paths.has("startDate")) {
    return "Please enter a cohort name and start date.";
  }
  if (paths.has("name")) return "Please enter a cohort name.";
  if (paths.has("startDate")) return "Please choose a cohort start date.";
  if (paths.has("fullName") && paths.has("email")) {
    return "Please enter the member's full name and email address.";
  }
  if (paths.has("fullName")) return "Please enter the member's full name.";
  if (paths.has("email")) return "Please enter a valid email address.";
  if (paths.has("timezone")) return "Please choose the member's timezone from the dropdown.";

  return "Please check the form fields and try again.";
}

export function friendlyMeditationError(error: unknown, fallback: string) {
  const message = textFromUnknown(error).trim();
  if (!message) return fallback;

  const validationMessage = messageFromValidationIssues(message);
  if (validationMessage) return validationMessage;

  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password did not match. Check both fields and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please open the latest email from Now Off Duty and use that sign-in link first.";
  }
  if (lower.includes("otp") || lower.includes("token has expired") || lower.includes("expired")) {
    return "This sign-in link has expired. Request a fresh link from the login page.";
  }
  if (lower.includes("rate limit") || lower.includes("security purposes")) {
    return "Please wait a minute before requesting another email, then try again.";
  }
  if (lower.includes("admin login required")) {
    return "Please sign in again before using the admin dashboard.";
  }
  if (lower.includes("admin access required")) {
    return "This account is not marked as an admin. Sign in with Chris's admin account.";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("rls")
  ) {
    return "Supabase blocked this request. Check the member role and database policies, then try again.";
  }
  if (lower.includes("duplicate key")) {
    return "This record already exists. Refresh the page and check the selected cohort before trying again.";
  }
  if (lower.includes("cannot coerce") || lower.includes("json object")) {
    return "The app could not read the saved record. Refresh the page and try again.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed")
  ) {
    return "The app could not reach Supabase. Check the connection and try again.";
  }
  if (lower.includes("invalid url")) {
    return "Please enter a full URL that starts with https:// or http://.";
  }

  if (message.includes("{") || message.includes("[") || message.length > 180) {
    return fallback;
  }

  return message;
}
