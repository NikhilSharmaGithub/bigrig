import { redirect } from "next/navigation";

// Stripe hits this if the onboarding link expired — send them back to retry.
export default function ConnectRefreshPage() {
  redirect("/vendor");
}
