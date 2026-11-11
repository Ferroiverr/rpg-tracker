import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: "Ошибка выхода" }, { status: 500 });
  }
  return NextResponse.redirect(new URL("/", request.url), 303);
}
