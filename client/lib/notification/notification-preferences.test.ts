import assert from "node:assert/strict";

import type { NotificationType } from "@/generated/prisma/client";
import {
  PREFERENCE_CATEGORIES,
  PREFERENCE_CATEGORY_TYPES,
} from "./notification-preferences";

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "ASSIGNEE_ADDED",
  "ASSIGNEE_REMOVED",
  "NOTE_ADDED",
  "MENTIONED",
  "STATE_CHANGED",
  "DUE_DATE_REMINDER",
];

// Every NotificationType the schema defines must appear in the Manage
// Notifications page's category grouping exactly once — a type left out
// would be un-toggleable, and a type in two categories would make the page
// show it twice.
const categorizedTypes = PREFERENCE_CATEGORIES.flatMap(
  (category) => PREFERENCE_CATEGORY_TYPES[category]
);
assert.deepEqual(
  [...categorizedTypes].sort(),
  [...ALL_NOTIFICATION_TYPES].sort()
);
assert.equal(
  categorizedTypes.length,
  new Set(categorizedTypes).size,
  "no NotificationType may appear in two categories"
);

console.log("notification preferences test passed");
