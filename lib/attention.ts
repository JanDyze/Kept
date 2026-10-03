// Pacing for the things Kept pops up on its own: page tips (components/tour.tsx), the offer to
// turn on notifications (components/notification-prompt.tsx) and What's new. At most one of
// them a day, so a new person isn't met with everything at once; the notification offer also
// waits until a day after their first visit. Per device (localStorage); without storage nothing
// is held back by it.

const DAY_KEY = "kept:attention-day"; // the local date something last popped up
const FIRST_KEY = "kept:first-seen"; // the local date of the first visit

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

// The first visit's date (recorded now if this is it).
export function firstSeen() {
  const seen = read(FIRST_KEY);
  if (seen) return seen;
  write(FIRST_KEY, today());
  return today();
}

// Has something already popped up today?
export const usedToday = () => read(DAY_KEY) === today();

// Takes today's turn if it's free: true means go ahead and show.
export function claimToday() {
  firstSeen();
  if (usedToday()) return false;
  write(DAY_KEY, today());
  return true;
}

// Something shown regardless (What's new after an update) still uses up the day.
export const spendToday = () => write(DAY_KEY, today());

// Not on the first day.
export const pastFirstDay = () => firstSeen() < today();
