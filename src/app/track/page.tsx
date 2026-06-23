import type { Metadata } from "next";
import { TrackForm } from "@/components/account/TrackForm";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your Big Rig Components order.",
};

type Props = { searchParams: Promise<{ order?: string }> };

export default async function TrackPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
        Track Your Order
      </h1>
      <p className="mt-1 text-steel-500">
        Enter your order number and the email used at checkout.
      </p>
      <div className="mt-8">
        <TrackForm defaultOrder={order} />
      </div>
    </div>
  );
}
