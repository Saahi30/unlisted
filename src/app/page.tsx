// Homepage is served by Framer via rewrite in next.config.ts
// This file exists as a fallback but should never be reached
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/shares");
}
