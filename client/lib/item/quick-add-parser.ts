export type ParsedQuickAdd = {
  title: string;
  dueDate: Date | null;
  labelNames: string[];
  assigneeNames: string[];
  listName: string | null;
};

// Quick-Add's grammar (#45): `@name` for an Assignee and `#name` for a
// Label are fixed by docs/Frontend-Overview.md. Neither that doc nor the
// QnA session settled a List-shorthand symbol or a date grammar, so both
// are implementation-time calls: `~name` targets a List (unused by any
// other shorthand), and dates are a single recognized word — "today",
// "tomorrow", a weekday name/abbreviation, or an ISO `YYYY-MM-DD` date —
// rather than free-form natural language.
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const WEEKDAY_ABBREVIATIONS: Record<string, string> = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

// A bare weekday always means its next occurrence, never today — typing
// "today" is how a same-day due date is expressed, so a weekday token
// that matches today's own weekday resolves to next week instead.
function resolveNextWeekday(now: Date, weekdayName: string): Date {
  const today = startOfUtcDay(now);
  const targetIndex = WEEKDAYS.indexOf(weekdayName);
  const daysUntilTarget = (targetIndex - today.getUTCDay() + 7) % 7 || 7;
  return addUtcDays(today, daysUntilTarget);
}

function resolveIsoDate(word: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(word);
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  const isRealCalendarDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isRealCalendarDate ? date : null;
}

function resolveDateWord(word: string, now: Date): Date | null {
  const lowerWord = word.toLowerCase();

  if (lowerWord === "today") {
    return startOfUtcDay(now);
  }
  if (lowerWord === "tomorrow") {
    return addUtcDays(startOfUtcDay(now), 1);
  }

  const weekdayName = WEEKDAYS.includes(lowerWord) ? lowerWord : WEEKDAY_ABBREVIATIONS[lowerWord];
  if (weekdayName) {
    return resolveNextWeekday(now, weekdayName);
  }

  return resolveIsoDate(word);
}

function extractPrefixedTokens(text: string, prefix: string): { names: string[]; remaining: string } {
  const pattern = new RegExp(`${prefix}(\\S+)`, "g");
  const names: string[] = [];
  const remaining = text.replace(pattern, (_match, name: string) => {
    names.push(name);
    return " ";
  });
  return { names, remaining };
}

// Parses Quick-Add's typed shorthand — `~list`, `@assignee`, `#label`, and
// a single date word — out of free text, leaving the rest as the Item
// title. Pure and DB-free by design (#45): resolving the extracted names
// into List/User/Label rows is item-quick-add.ts's job, not this one's.
export function parseQuickAdd(text: string, now: Date = new Date()): ParsedQuickAdd {
  const { names: listNames, remaining: afterList } = extractPrefixedTokens(text, "~");
  const { names: assigneeNames, remaining: afterAssignees } = extractPrefixedTokens(afterList, "@");
  const { names: labelNames, remaining: afterLabels } = extractPrefixedTokens(afterAssignees, "#");

  const words = afterLabels.split(/\s+/).filter((word) => word.length > 0);
  const titleWords: string[] = [];
  let dueDate: Date | null = null;

  for (const word of words) {
    const parsedDate: Date | null = dueDate === null ? resolveDateWord(word, now) : null;
    if (parsedDate !== null) {
      dueDate = parsedDate;
      continue;
    }
    titleWords.push(word);
  }

  return {
    title: titleWords.join(" "),
    dueDate,
    labelNames,
    assigneeNames,
    listName: listNames[0] ?? null,
  };
}
