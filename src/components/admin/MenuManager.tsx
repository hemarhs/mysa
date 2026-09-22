"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import {
  AdminButton,
  Card,
  EmptyState,
  Input,
  Label,
  Pill,
  Select,
  Textarea,
} from "@/components/admin/ui";
import {
  createMenuItem,
  deleteMenuItem,
  toggleMenuItemFlag,
  updateMenuItem,
  type ActionState,
} from "@/app/(admin)/admin/actions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Category, MenuItem } from "@/lib/db/schema";

type Row = { item: MenuItem; categoryName: string; categorySlug: string };

const initial: ActionState = { status: "idle" };

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </AdminButton>
  );
}

/** Small inline form used by the featured / sold-out / visible switches. */
function ToggleButton({
  id,
  field,
  value,
  onLabel,
  offLabel,
  tone = "gold",
}: {
  id: string;
  field: string;
  value: boolean;
  onLabel: string;
  offLabel: string;
  tone?: "gold" | "alert" | "neutral";
}) {
  const tones = {
    gold: value ? "border-gold-ink bg-gold/15 text-gold-ink" : "border-espresso/15 text-mocha",
    alert: value
      ? "border-alert bg-alert/10 text-alert"
      : "border-espresso/15 text-mocha",
    neutral: value ? "border-espresso/40 text-espresso" : "border-espresso/15 text-mocha",
  };

  return (
    <form action={toggleMenuItemFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!value)} />
      <button
        type="submit"
        aria-pressed={value}
        className={cn(
          "border px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300 hover:border-espresso/45",
          tones[tone]
        )}
      >
        {value ? onLabel : offLabel}
      </button>
    </form>
  );
}

function ItemForm({
  categories,
  item,
  onDone,
}: {
  categories: Category[];
  item?: MenuItem;
  onDone: () => void;
}) {
  const action = item ? updateMenuItem : createMenuItem;
  const [state, formAction] = useActionState<ActionState, FormData>(action, initial);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-6">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-alert bg-alert/8 py-3 pl-4 text-[0.875rem] text-alert">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={item?.name} required maxLength={160} />
        </div>

        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={item?.categoryId} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="6.25"
            defaultValue={item ? (item.priceCents / 100).toFixed(2) : ""}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={item?.description ?? ""}
            placeholder="How it is made, and what it tastes like."
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={item?.imageUrl ?? ""}
            placeholder="https://…"
          />
          <p className="mt-2 text-[0.8125rem] text-mocha">
            Optional. Shown on the home page and as a hover preview on the menu.
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={item?.tags.join(", ") ?? ""}
            placeholder="vegan, contains nuts"
          />
          <p className="mt-2 text-[0.8125rem] text-mocha">Comma separated.</p>
        </div>

        <div>
          <Label htmlFor="position">Order</Label>
          <Input
            id="position"
            name="position"
            type="number"
            min={0}
            max={999}
            defaultValue={item?.position ?? 0}
          />
        </div>
      </div>

      <fieldset className="flex flex-wrap gap-x-8 gap-y-3 border-t border-espresso/12 pt-5">
        <legend className="sr-only">Status</legend>
        {[
          { name: "isFeatured", label: "House pick", checked: item?.isFeatured ?? false },
          { name: "isSoldOut", label: "Sold out", checked: item?.isSoldOut ?? false },
          { name: "isActive", label: "Visible on the site", checked: item?.isActive ?? true },
        ].map((field) => (
          <label key={field.name} className="flex items-center gap-2.5 font-sans text-[0.9375rem] text-espresso">
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={field.checked}
              className="h-4 w-4 accent-[#8f724a]"
            />
            {field.label}
          </label>
        ))}
      </fieldset>

      <div className="flex gap-3 pt-2">
        <SaveButton label={item ? "Save changes" : "Add item"} />
        <AdminButton type="button" tone="secondary" onClick={onDone}>
          Cancel
        </AdminButton>
      </div>
    </form>
  );
}

export function MenuManager({ rows, categories }: { rows: Row[]; categories: Category[] }) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const grouped = categories.map((category) => ({
    category,
    items: rows.filter((r) => r.item.categoryId === category.id).map((r) => r.item),
  }));

  const close = () => {
    setEditing(null);
    setAdding(false);
  };

  if (!categories.length) {
    return (
      <EmptyState
        title="No categories yet"
        body="Add a category below before adding items to the menu."
      />
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <AdminButton onClick={() => { setAdding(true); setEditing(null); }}>Add item</AdminButton>
      </div>

      <AnimatePresence>
        {(adding || editing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Card className="bg-white/50">
              <h2 className="font-display text-[1.375rem] font-light text-espresso">
                {editing ? `Edit “${editing.name}”` : "New menu item"}
              </h2>
              <div className="mt-7">
                <ItemForm
                  key={editing?.id ?? "new"}
                  categories={categories}
                  item={editing ?? undefined}
                  onDone={close}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {grouped.map(({ category, items }) => (
        <section key={category.id}>
          <div className="flex items-end justify-between border-b border-espresso/12 pb-3">
            <h2 className="font-display text-[1.375rem] font-light text-espresso">{category.name}</h2>
            <span className="font-sans text-[0.75rem] uppercase tracking-[0.14em] text-mocha">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {items.length ? (
            <ul className="divide-y divide-espresso/10">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-x-5 gap-y-3 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "font-sans text-[1rem]",
                          item.isActive ? "text-espresso" : "text-mocha line-through"
                        )}
                      >
                        {item.name}
                      </span>
                      {!item.isActive ? <Pill>Hidden</Pill> : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1.5 line-clamp-1 max-w-xl text-[0.875rem] text-mocha">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 font-sans text-[0.9375rem] tabular-nums text-espresso">
                    {formatPrice(item.priceCents)}
                  </span>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ToggleButton
                      id={item.id}
                      field="isFeatured"
                      value={item.isFeatured}
                      onLabel="House pick"
                      offLabel="Not picked"
                    />
                    <ToggleButton
                      id={item.id}
                      field="isSoldOut"
                      value={item.isSoldOut}
                      onLabel="Sold out"
                      offLabel="Available"
                      tone="alert"
                    />
                    <ToggleButton
                      id={item.id}
                      field="isActive"
                      value={item.isActive}
                      onLabel="Visible"
                      offLabel="Hidden"
                      tone="neutral"
                    />

                    <button
                      type="button"
                      onClick={() => { setEditing(item); setAdding(false); }}
                      className="px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] text-mocha underline decoration-ink/25 underline-offset-4 transition-colors hover:text-espresso"
                    >
                      Edit
                    </button>

                    {confirming === item.id ? (
                      <form action={deleteMenuItem} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="border border-alert bg-alert/10 px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] text-alert"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha"
                        >
                          No
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(item.id)}
                        className="px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] text-mocha transition-colors hover:text-alert"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-[0.9375rem] text-mocha">Nothing in this category yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}
