import { and, eq, isNull } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { verses } from "@/lib/db/schema";
import { NavigationOverlay, PSALM_119_11 } from "./navigation-overlay";

// Loads your saved verses once (with the app) for the loading overlay to rotate through.
export async function NavigationOverlayWithVerses() {
  const user = await getUser();
  const saved = user
    ? await db
        .select({ reference: verses.reference, translation: verses.translation, text: verses.text })
        .from(verses)
        .where(and(eq(verses.userId, user.id), isNull(verses.archivedAt)))
        .limit(100)
    : [];
  const hasPsalm = saved.some((v) => v.reference === PSALM_119_11.reference && v.translation === PSALM_119_11.translation);
  return <NavigationOverlay verses={hasPsalm ? saved : [PSALM_119_11, ...saved]} />;
}
