import { redirect } from "next/navigation";

// Progress now lives on your profile.
export default function StatsPage() {
  redirect("/me");
}
