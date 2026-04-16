import { redirect } from "next/navigation";

// Root "/" → redirect to /login or /dashboard (handled by middleware)
export default function RootPage() {
  redirect("/dashboard");
}
