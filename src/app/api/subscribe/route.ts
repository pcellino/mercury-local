import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPublicationFromRequest } from "@/lib/publication";

export async function POST(request: NextRequest) {
  try {
    const { publication } = await getPublicationFromRequest();

    // Accept both JSON and form-encoded bodies
    const contentType = request.headers.get("content-type") || "";
    let email: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email;
    } else {
      const formData = await request.formData();
      email = formData.get("email")?.toString();
    }

    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Normalize
    email = email.trim().toLowerCase();

    // Untyped client — the subscribers table is new and the typed Database
    // interface doesn't support Insert generics for all tables yet.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.from("subscribers").upsert(
      {
        email,
        publication_id: publication.id,
        status: "active",
        source: "homepage",
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "email,publication_id" }
    );

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // For form submissions, redirect back with a success flag
    if (!contentType.includes("application/json")) {
      const referer = request.headers.get("referer") || "/";
      const url = new URL(referer);
      url.searchParams.set("subscribed", "1");
      return NextResponse.redirect(url.toString(), 303);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe route error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
