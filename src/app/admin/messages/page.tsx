import type { Metadata } from "next";
import { getContactMessages } from "@/lib/admin";
import { markMessageReadAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Admin · Messages" };

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Messages{" "}
        {unread > 0 && (
          <span className="align-middle text-base text-brand">({unread} new)</span>
        )}
      </h1>

      {messages.length === 0 ? (
        <p className="mt-6 text-steel-500">No messages yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border bg-white p-4 ${
                m.isRead ? "border-border" : "border-brand"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-steel-900">
                    {m.name}{" "}
                    {!m.isRead && (
                      <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    )}
                  </p>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-brand hover:underline"
                  >
                    {m.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-steel-500">
                    {m.createdAt.toLocaleString()}
                  </span>
                  <form action={markMessageReadAction.bind(null, m.id, !m.isRead)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-steel-700 hover:border-brand hover:text-brand"
                    >
                      Mark {m.isRead ? "unread" : "read"}
                    </button>
                  </form>
                </div>
              </div>
              {m.subject && (
                <p className="mt-2 text-sm font-medium text-steel-700">
                  {m.subject}
                </p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-sm text-steel-600">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
