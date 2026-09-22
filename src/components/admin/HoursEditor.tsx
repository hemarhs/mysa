"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { AdminButton, Card, Input, Label, Textarea } from "@/components/admin/ui";
import { updateHours, updateSettings, type ActionState } from "@/app/(admin)/admin/actions";
import { DAY_NAMES } from "@/lib/format";
import type { Hours, Settings } from "@/lib/db/queries";

const initial: ActionState = { status: "idle" };

function Saved({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  const error = state.status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "border-l-2 border-alert bg-alert/8 py-3 pl-4 text-[0.875rem] text-alert"
          : "border-l-2 border-gold-ink bg-gold/10 py-3 pl-4 text-[0.875rem] text-gold-ink"
      }
    >
      {state.message}
    </p>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </AdminButton>
  );
}

export function HoursEditor({ hours }: { hours: Hours[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateHours, initial);

  // Monday first, which is how anyone reads a café's hours.
  const ordered = [1, 2, 3, 4, 5, 6, 0].map(
    (day) =>
      hours.find((h) => h.dayOfWeek === day) ?? {
        id: `d${day}`,
        dayOfWeek: day,
        opensAt: "08:00",
        closesAt: "17:00",
        isClosed: false,
        note: null,
      }
  );

  return (
    <Card>
      <h2 className="font-display text-[1.375rem] font-light text-espresso">Opening hours</h2>
      <p className="mt-2 max-w-lg text-[0.875rem] leading-relaxed text-mocha">
        Shown in the footer, on the contact page, and used for the “open now”
        indicator. Twenty-four hour time.
      </p>

      <form action={formAction} className="mt-7 space-y-5">
        <Saved state={state} />

        <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
          {ordered.map((hour) => (
            <li
              key={hour.dayOfWeek}
              className="grid items-center gap-4 py-4 sm:grid-cols-[8rem_auto_auto_1fr]"
            >
              <span className="font-sans text-[0.9375rem] text-espresso">
                {DAY_NAMES[hour.dayOfWeek]}
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor={`opensAt-${hour.dayOfWeek}`} className="sr-only">
                  {DAY_NAMES[hour.dayOfWeek]} opening time
                </label>
                <input
                  id={`opensAt-${hour.dayOfWeek}`}
                  name={`opensAt-${hour.dayOfWeek}`}
                  type="time"
                  defaultValue={hour.opensAt}
                  className="border border-espresso/18 bg-white/60 px-3 py-2 font-sans text-[0.875rem] tabular-nums text-espresso"
                />
                <span className="text-mocha">–</span>
                <label htmlFor={`closesAt-${hour.dayOfWeek}`} className="sr-only">
                  {DAY_NAMES[hour.dayOfWeek]} closing time
                </label>
                <input
                  id={`closesAt-${hour.dayOfWeek}`}
                  name={`closesAt-${hour.dayOfWeek}`}
                  type="time"
                  defaultValue={hour.closesAt}
                  className="border border-espresso/18 bg-white/60 px-3 py-2 font-sans text-[0.875rem] tabular-nums text-espresso"
                />
              </div>

              <label className="flex items-center gap-2.5 font-sans text-[0.875rem] text-mocha">
                <input
                  type="checkbox"
                  name={`isClosed-${hour.dayOfWeek}`}
                  defaultChecked={hour.isClosed}
                  className="h-4 w-4 accent-[#8f724a]"
                />
                Closed
              </label>

              <div>
                <label htmlFor={`note-${hour.dayOfWeek}`} className="sr-only">
                  {DAY_NAMES[hour.dayOfWeek]} note
                </label>
                <input
                  id={`note-${hour.dayOfWeek}`}
                  name={`note-${hour.dayOfWeek}`}
                  defaultValue={hour.note ?? ""}
                  placeholder="Optional note"
                  maxLength={160}
                  className="w-full border border-espresso/18 bg-white/60 px-3 py-2 font-sans text-[0.875rem] text-espresso"
                />
              </div>
            </li>
          ))}
        </ul>

        <Submit label="Save hours" />
      </form>
    </Card>
  );
}

export function LocationEditor({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateSettings, initial);

  return (
    <Card>
      <h2 className="font-display text-[1.375rem] font-light text-espresso">Location &amp; contact</h2>
      <p className="mt-2 max-w-lg text-[0.875rem] leading-relaxed text-mocha">
        Used in the footer, on the contact page, in the map, and in the search-engine
        listing for the café.
      </p>

      <form action={formAction} className="mt-7 space-y-6">
        <Saved state={state} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" name="addressLine1" defaultValue={settings.addressLine1} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input id="addressLine2" name="addressLine2" defaultValue={settings.addressLine2 ?? ""} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={settings.city} required />
          </div>
          <div>
            <Label htmlFor="region">Region / state</Label>
            <Input id="region" name="region" defaultValue={settings.region ?? ""} />
          </div>
          <div>
            <Label htmlFor="postalCode">Postcode</Label>
            <Input id="postalCode" name="postalCode" defaultValue={settings.postalCode ?? ""} />
          </div>
          <div>
            <Label htmlFor="country">Country code</Label>
            <Input id="country" name="country" defaultValue={settings.country} maxLength={2} required />
          </div>
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" name="latitude" defaultValue={settings.latitude ?? ""} placeholder="37.7765" />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" name="longitude" defaultValue={settings.longitude ?? ""} placeholder="-122.4241" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="mapUrl">Map link</Label>
            <Input id="mapUrl" name="mapUrl" type="url" defaultValue={settings.mapUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={settings.email} required />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={settings.currency} maxLength={3} required />
            <p className="mt-2 text-[0.8125rem] text-mocha">
              Three-letter code, e.g. USD or GBP.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="neighbourhoodNote">Note about finding us</Label>
            <Textarea
              id="neighbourhoodNote"
              name="neighbourhoodNote"
              rows={2}
              defaultValue={settings.neighbourhoodNote ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="announcement">Announcement</Label>
            <Textarea
              id="announcement"
              name="announcement"
              rows={2}
              maxLength={300}
              defaultValue={settings.announcement ?? ""}
              placeholder="Closed 24–26 December"
            />
            <p className="mt-2 text-[0.8125rem] text-mocha">
              Appears under the headline on the home page. Leave empty to hide it.
            </p>
          </div>
        </div>

        <Submit label="Save details" />
      </form>
    </Card>
  );
}
