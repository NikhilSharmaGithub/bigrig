import type { Metadata } from "next";
import { AddressForm } from "@/components/account/AddressForm";
import { deleteAddressAction } from "@/app/actions/account";
import { requireUser } from "@/lib/auth";
import { getUserAddresses } from "@/lib/account";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const list = await getUserAddresses(user.id);

  return (
    <div>
      <h1 className="font-display border-b-2 border-steel-900 pb-2 text-3xl font-bold uppercase text-steel-900">
        Addresses
      </h1>

      {list.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <li
              key={a.id}
              className="relative rounded-lg border border-border bg-white p-4 text-sm text-steel-700"
            >
              <p className="font-medium text-steel-900">{a.fullName}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>
                {a.city}, {a.state} {a.postalCode}
              </p>
              <p>{a.country}</p>
              {a.phone && <p className="text-steel-500">{a.phone}</p>}
              <form action={deleteAddressAction.bind(null, a.id)}>
                <button
                  type="submit"
                  className="absolute right-3 top-3 text-xs font-semibold text-steel-400 hover:text-danger"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-display mt-10 text-xl font-bold uppercase text-steel-900">
        Add an Address
      </h2>
      <div className="mt-4 max-w-xl">
        <AddressForm />
      </div>
    </div>
  );
}
