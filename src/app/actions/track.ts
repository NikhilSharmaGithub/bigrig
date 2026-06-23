"use server";

import { getOrderForTracking } from "@/lib/orders";

export type TrackState = {
  error?: string;
  order?: {
    orderNumber: string;
    status: string;
    placedAt: string;
    totalCents: number;
    items: { name: string; quantity: number }[];
  };
};

export async function trackOrderAction(
  _prev: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const orderNumber = String(formData.get("order") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!orderNumber || !email) {
    return { error: "Enter your order number and email." };
  }

  const order = await getOrderForTracking(orderNumber, email);
  if (!order) {
    return { error: "No matching order found. Double-check your details." };
  }

  return {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    },
  };
}
