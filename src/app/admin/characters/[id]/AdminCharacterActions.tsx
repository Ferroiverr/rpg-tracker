"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, HeartPlus, Info, Shield, Swords, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Character } from "@/lib/types";

export default function AdminCharacterActions({character}:{character:Character}){
  const [amount,setAmount]=useState(1);
  const [note,setNote]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();

  async function apply(action:"damage"|"heal"|"set_armor"){
    if(!Number.isInteger(amount)||amount<(action==="set_armor"?0:1)||amount>100000){setMessage("Укажите целое количество в допустимых пределах.");return;}
    setBusy(true);setMessage("");
    try{
      const {error}=await createClient().rpc("apply_character_action",{p_character_id:character.id,p_action:action,p_amount:amount,p_note:note.trim()});
      if(error)throw error;
      setNote("");setMessage("Изменение применено и записано в журнал.");router.refresh();
    } catch(error:unknown){setMessage(error instanceof Error?error.message:"Не удалось сохранить действие");}
    finally{setBusy(false);}
  }
  async function removeCharacter(){
    if(!window.confirm(`НАВСЕГДА удалить персонажа «${character.name}» со всеми картами и историей?`))return;
    setBusy(true);setMessage("");
    const supabase=createClient();
    try{
      const {error}=await supabase.from("characters").delete().eq("id",character.id);
      if(error)throw error;
      if(character.image_path){const {error:storageError}=await supabase.storage.from("character-images").remove([character.image_path]);if(storageError)console.error("Изображение не удалилось из Storage",storageError);}
      router.replace("/admin");router.refresh();
    } catch(error:unknown){setMessage(error instanceof Error?error.message:"Не удалось удалить персонажа");}
    finally{setBusy(false);}
  }

  return <section className="surface space-y-6 p-5 sm:p-7 xl:p-8">
    <div className="panel-header"><div><p className="eyebrow">Боевая система</p><h3 className="section-title mt-2">Изменение характеристик</h3><p className="subtle mt-2">Урон сначала поглощается бронёй. Лечение не поднимает HP выше максимума.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-[#3f5368] bg-[#1d3040] px-4 py-2 text-xs font-bold text-[#b5cfe4]"><Info size={16}/> Только для одобренных героев</span></div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(180px,260px)_minmax(0,1fr)]">
      <label className="field-label">Количество единиц<input className="control mt-2 !text-lg font-bold tabular-nums" type="number" min={0} max={100000} step={1} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label>
      <label className="field-label">Причина / комментарий<input className="control mt-2" maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Например: удар монстра или бросок кубика"/></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <button type="button" disabled={busy||character.status!=="approved"} onClick={()=>void apply("damage")} className="action-button-danger !min-h-[62px] !w-full"><Swords size={22} aria-hidden="true"/> Нанести урон</button>
      <button type="button" disabled={busy||character.status!=="approved"} onClick={()=>void apply("heal")} className="action-button-success !min-h-[62px] !w-full"><HeartPlus size={22} aria-hidden="true"/> Восстановить HP</button>
      <button type="button" disabled={busy||character.status!=="approved"} onClick={()=>void apply("set_armor")} className="action-button-quiet !min-h-[62px] !w-full !border-[#4f738e] !bg-[#1b3447] !text-[#b9e0fa]"><Shield size={22} aria-hidden="true"/> Установить броню</button>
    </div>
    {message && <p role="status" className="notice">{message}</p>}
    <details className="group rounded-xl border border-[#583b47] bg-[#261b24] p-4 sm:p-5"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 font-bold text-[#f0adb7]"><AlertTriangle size={20} className="shrink-0"/> Опасная зона <span className="ml-auto text-xs font-normal text-[#d1a7af]">Нажмите для раскрытия</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4b9c0]">Удаление необратимо: пропадут карты и история. Обычно лучше перевести персонажа в архив.</p><button type="button" disabled={busy} onClick={()=>void removeCharacter()} className="action-button-danger mt-4"><Trash2 size={18} aria-hidden="true"/> Удалить персонажа навсегда</button></details>
  </section>;
}
