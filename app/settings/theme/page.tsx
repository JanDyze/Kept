import type { Metadata } from "next";
import { Screen } from "@/components/screen";
import { ThemePicker } from "@/components/theme-picker";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Theme" };

export default async function ThemePage() {
  await requireUser();
  return (
    <Screen back={{ href: "/settings", label: "Settings" }} title="Theme">
      <ThemePicker />
    </Screen>
  );
}
