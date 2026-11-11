"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CharacterStatus } from "@/lib/types";

export default function ModerationButtons({id,status}:{id:string;status:CharacterStatus}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();
  async function moderate(nextStatus:"approved"|"rejected"|"archived"){
    const note=nextStatus==="rejected" ? window.prompt("Причина отклонения (необязательно):", "") : "";
    if(note===null) return;
    if(nextStatus==="archived" && !window.confirm("Перевести персонажа в архив?")) return;
    setBusy(true);setMessage("");
    try {
      const {error}=await createClient().rpc("moderate_character",{p_character_id:id,p_status:nextStatus,p_note:note||""});
      if(error) throw error;
      router.refresh();
    } catch(error:unknown){setMessage(error instanceof Error?error.message:"Не удалось изменить статус");}
    finally{setBusy(false);}
  }
  return <div className="flex min-w-0 flex-wrap items-center gap-3">
    {status!=="approved" && <button type="button" disabled={busy} onClick={()=>void moderate("approved")} className="action-button-success"><Check size={19} aria-hidden="true"/> Одобрить</button>}
    {status==="pending" && <button type="button" disabled={busy} onClick={()=>void moderate("rejected")} className="action-button-danger"><X size={18} aria-hidden="true"/> Отклонить</button>}
    {status==="approved" && <button type="button" disabled={busy} onClick={()=>void moderate("archived")} className="action-button-quiet"><Archive size={18} aria-hidden="true"/> В архив</button>}
    {message && <p role="alert" className="notice notice-error w-full">{message}</p>}
  </div>;
}
