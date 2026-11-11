"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rpg-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "characters" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "character_cards" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "character_actions" }, () => router.refresh())
      .subscribe();

    // После возврата на вкладку забираем изменения, пропущенные во время сна устройства.
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [router]);
  return null;
}
