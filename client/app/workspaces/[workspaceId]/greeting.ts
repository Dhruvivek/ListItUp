const MORNING_ENDS_AT_HOUR = 12;
const AFTERNOON_ENDS_AT_HOUR = 18;

export type Greeting = "Good morning" | "Good afternoon" | "Good evening";

// Home's header greeting is date/time-only, with no numeric stats —
// stats and time-filtering were deferred to the Reports & Analytics
// ticket (#46, docs/QnA/listitup-profile-and-home-surface.md §9).
export function greetingForHour(hour: number): Greeting {
  if (hour < MORNING_ENDS_AT_HOUR) return "Good morning";
  if (hour < AFTERNOON_ENDS_AT_HOUR) return "Good afternoon";
  return "Good evening";
}
