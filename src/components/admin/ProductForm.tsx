"use client";

import { useActionState } from "react";
import { KeywordsInput } from "@/components/admin/KeywordsInput";
import { ImageUploader } from "@/components/admin/ImageUploader";

type FormResult = { error?: string; ok?: boolean };
type Option = { id: string; label: string };

export type ProductFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  partNumber?: string;
  brandId?: string | null;
  categoryId?: string | null;
  priceDollars?: string;
  listPriceDollars?: string;
  description?: string | null;
  highlights?: string | null;
  keywords?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive?: boolean;
  qty?: number;
  images?: string;
};

const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

export function ProductForm({
  action,
  mode,
  brands,
  categories,
  values,
  includeActive = mode === "edit",
  submitLabel,
}: {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
  mode: "create" | "edit";
  brands: Option[];
  categories: Option[];
  values?: ProductFormValues;
  includeActive?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<FormResult, FormData>(
    action,
    {},
  );
  const v = values ?? {};
  const save = submitLabel ?? (mode === "create" ? "Create Product" : "Save Changes");

  return (
    <form action={formAction} className="max-w-3xl space-y-5 pb-4">
      {mode === "edit" && v.id && <input type="hidden" name="id" value={v.id} />}

      {/* Basics */}
      <Section title="Basics" subtitle="The essentials buyers see first.">
        <Field label="Product name" required>
          <input name="name" defaultValue={v.name} className={inputClass} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL slug" hint="Leave blank to auto-generate from the name.">
            <input name="slug" defaultValue={v.slug} className={inputClass} placeholder="auto-from-name" />
          </Field>
          <Field label="Part number" required>
            <input name="partNumber" defaultValue={v.partNumber} className={inputClass} required />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand">
            <select name="brandId" defaultValue={v.brandId ?? ""} className={inputClass}>
              <option value="">— none —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select name="categoryId" defaultValue={v.categoryId ?? ""} className={inputClass}>
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Pricing & inventory */}
      <Section title="Pricing & Inventory">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price" required>
            <MoneyInput name="price" defaultValue={v.priceDollars} required />
          </Field>
          <Field label="Compare-at price" hint="Optional — shows a strikethrough.">
            <MoneyInput name="listPrice" defaultValue={v.listPriceDollars} />
          </Field>
          <Field label="Stock quantity">
            <input
              name="qty"
              defaultValue={v.qty ?? 0}
              className={inputClass}
              inputMode="numeric"
            />
          </Field>
        </div>
      </Section>

      {/* Media */}
      <Section title="Photos" subtitle="Drag in images or paste URLs. The first is the main photo.">
        <ImageUploader name="images" defaultValue={v.images ?? ""} />
      </Section>

      {/* Description */}
      <Section title="Description">
        <Field label="Full description" hint="Leave a blank line between paragraphs.">
          <textarea
            name="description"
            defaultValue={v.description ?? ""}
            rows={5}
            className={inputClass}
            placeholder="Describe the part, materials, and what makes it good…"
          />
        </Field>
        <Field label="About this item" hint="One highlight per line — shown as bullet points.">
          <textarea
            name="highlights"
            defaultValue={v.highlights ?? ""}
            rows={4}
            className={inputClass}
            placeholder={"Fits Type 30 air brake systems\nCorrosion-resistant housing\nDirect bolt-on replacement"}
          />
        </Field>
      </Section>

      {/* SEO */}
      <Section title="Search & SEO" subtitle="Helps this product get found on Google and on-site search.">
        <Field label="Keywords">
          <KeywordsInput name="keywords" defaultValue={v.keywords ?? ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title" hint="Defaults to the product name.">
            <input name="metaTitle" defaultValue={v.metaTitle ?? ""} className={inputClass} />
          </Field>
          <Field label="SEO description" hint="~155 characters for Google.">
            <input name="metaDescription" defaultValue={v.metaDescription ?? ""} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3.5 shadow-lg">
        <div className="min-w-0">
          {includeActive ? (
            <label className="flex items-center gap-2 text-sm text-steel-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={v.isActive ?? true}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Active (visible in store)
            </label>
          ) : (
            <span className="text-xs text-steel-400">New products go live immediately.</span>
          )}
          {state.error && <p className="mt-0.5 text-sm text-danger">{state.error}</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Saving…" : save}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-steel-900">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-steel-500">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-steel-700">
        {label}
        {required && <span className="text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-steel-400">{hint}</span>}
    </label>
  );
}

function MoneyInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-steel-400">
        $
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        inputMode="decimal"
        required={required}
        className={`${inputClass} pl-7`}
        placeholder="0.00"
      />
    </div>
  );
}
