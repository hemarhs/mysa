"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AdminButton, Card, Input, Label, Textarea } from "@/components/admin/ui";
import { createCategory, deleteCategory, type ActionState } from "@/app/(admin)/admin/actions";
import type { Category } from "@/lib/db/schema";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" tone="secondary" disabled={pending}>
      {pending ? "Adding…" : "Add category"}
    </AdminButton>
  );
}

export function CategoryForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createCategory, {
    status: "idle",
  });
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <Card>
      <h2 className="font-display text-[1.375rem] font-light text-espresso">Categories</h2>
      <p className="mt-2 max-w-lg text-[0.875rem] leading-relaxed text-mocha">
        Sections on the menu page, in order. Deleting a category also deletes
        every item inside it.
      </p>

      <ul className="mt-6 divide-y divide-espresso/10 border-y border-espresso/10">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <span className="font-sans text-[0.9375rem] text-espresso">{category.name}</span>
              <span className="ml-3 font-mono text-[0.75rem] text-mocha">/{category.slug}</span>
            </div>

            {confirming === category.id ? (
              <form action={deleteCategory} className="flex shrink-0 items-center gap-2">
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  className="border border-alert bg-alert/10 px-2.5 py-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-alert"
                >
                  Delete it
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(category.id)}
                className="shrink-0 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:text-alert"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <form action={formAction} className="mt-7 space-y-5">
        {state.status === "error" ? (
          <p role="alert" className="border-l-2 border-alert bg-alert/8 py-3 pl-4 text-[0.875rem] text-alert">
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" required placeholder="Seasonal" />
          </div>
          <div>
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" name="slug" required placeholder="seasonal" pattern="[a-z0-9\-]+" />
          </div>
          <div>
            <Label htmlFor="cat-position">Order</Label>
            <Input id="cat-position" name="position" type="number" min={0} defaultValue={categories.length} />
          </div>
        </div>

        <div>
          <Label htmlFor="cat-description">Description</Label>
          <Textarea id="cat-description" name="description" rows={2} maxLength={400} />
        </div>

        <Submit />
      </form>
    </Card>
  );
}
