import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { UploadError, uploadImage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Image upload for the admin panel. Middleware does not cover /api, so the
 * session check here is the only gate — it must stay.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const prefix = String(formData.get("prefix") ?? "gallery").replace(/[^a-z0-9-]/gi, "") || "gallery";

  try {
    const result = await uploadImage(file, prefix);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[mysa] upload failed:", error);
    return NextResponse.json(
      { error: "The upload failed. Check that image storage is configured." },
      { status: 500 }
    );
  }
}
