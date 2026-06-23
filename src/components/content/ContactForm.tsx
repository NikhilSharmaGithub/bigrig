"use client";

import { useActionState } from "react";
import {
  submitContactAction,
  type ContactState,
} from "@/app/actions/contact";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    submitContactAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6 text-center">
        <p className="font-display text-lg font-bold text-steel-900">
          Message sent ✓
        </p>
        <p className="mt-1 text-sm text-steel-600">
          Thanks for reaching out — our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-border bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-steel-700">
            Name *
          </span>
          <input name="name" required className="ipt" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-steel-700">
            Email *
          </span>
          <input name="email" type="email" required className="ipt" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-700">
          Subject
        </span>
        <input name="subject" className="ipt" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-700">
          Message *
        </span>
        <textarea name="message" rows={5} required className="ipt" />
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>

      <style>{`
        .ipt {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--color-border);
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-steel-900);
        }
        .ipt:focus { outline: none; box-shadow: 0 0 0 2px var(--color-brand); }
      `}</style>
    </form>
  );
}
