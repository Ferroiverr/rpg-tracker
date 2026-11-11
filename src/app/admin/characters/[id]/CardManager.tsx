"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPlus, Plus, Save, Shield, Swords, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CardType, CharacterCard } from "@/lib/types";

const typeLabels:Record<CardType,string>={attack:"Урон",defense:"Защита",healing:"Лечение"};
const columns:{type:CardType;icon:typeof Swords;tone:string}[]=[
  {type:"attack",icon:Swords,tone:"action-badge-damage"},
  {type:"defense",icon:Shield,tone:"action-badge-defense"},
  {type:"healing",icon:HeartPlus,tone:"action-badge-heal"},
];

function ExistingCard({card}:{card:CharacterCard}){
  const [name,setName]=useState(card.name);
  const [description,setDescription]=useState(card.description);
  const [type,setType]=useState<CardType>(card.type);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();
  async function save(){
    if(!name.trim()||name.trim().length>100||description.length>2000){setMessage("Проверьте название и описание.");return;}
    setBusy(true);setMessage("");
    try{const {error}=await createClient().from("character_cards").update({name:name.trim(),description,type}).eq("id",card.id);if(error)throw error;setMessage("Изменения сохранены");router.refresh();}
    catch(error:unknown){setMessage(error instanceof Error?error.message:"Ошибка сохранения");}
    finally{setBusy(false);}
  }
  async function remove(){
    if(!window.confirm(`Удалить карту «${card.name}»?`))return;
    setBusy(true);setMessage("");
    try{const {error}=await createClient().from("character_cards").delete().eq("id",card.id);if(error)throw error;router.refresh();}
    catch(error:unknown){setMessage(error instanceof Error?error.message:"Ошибка удаления");}
    finally{setBusy(false);}
  }
  return <article className="game-card space-y-4">
    <label className="field-label">Название карты<input aria-label="Название карты" className="control mt-2" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label className="field-label">Категория<select aria-label="Категория карты" className="control mt-2" value={type} onChange={e=>setType(e.target.value as CardType)}>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label className="field-label">Описание<textarea aria-label="Описание карты" className="control mt-2 min-h-28 resize-y" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={()=>void save()} className="action-button-primary flex-1"><Save size={18} aria-hidden="true"/> Сохранить</button><button type="button" disabled={busy} onClick={()=>void remove()} className="action-button-quiet !border-[#7a4550] !text-[#f1a5b2]" aria-label={`Удалить карту ${card.name}`}><Trash2 size={18} aria-hidden="true"/></button></div>
    {message && <p role="status" className="notice">{message}</p>}
  </article>;
}

export default function CardManager({characterId,cards}:{characterId:string;cards:CharacterCard[]}){
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [type,setType]=useState<CardType>("attack");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();
  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!name.trim()){setMessage("Укажите название карты");return;}
    setBusy(true);setMessage("");
    try{const {error}=await createClient().from("character_cards").insert({character_id:characterId,type,name:name.trim(),description});if(error)throw error;setName("");setDescription("");setMessage("Карта добавлена");router.refresh();}
    catch(error:unknown){setMessage(error instanceof Error?error.message:"Ошибка добавления");}
    finally{setBusy(false);}
  }
  return <section className="surface space-y-7 p-5 sm:p-7 xl:p-8">
    <div><p className="eyebrow">Колода героя</p><h2 className="section-title mt-2">Карты персонажа</h2><p className="subtle mt-2">Создавайте, редактируйте и удаляйте карты трёх типов. Изменения синхронизируются у всех игроков.</p></div>
    <form className="surface-soft grid gap-5 p-5 sm:grid-cols-2 sm:p-6" onSubmit={add}>
      <label className="field-label">Название<input className="control mt-2" maxLength={100} value={name} onChange={e=>setName(e.target.value)} required placeholder="Название новой карты"/></label>
      <label className="field-label">Категория<select className="control mt-2" value={type} onChange={e=>setType(e.target.value as CardType)}>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="field-label sm:col-span-2">Описание<textarea className="control mt-2 min-h-28 resize-y" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Опишите действие карты"/></label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><button disabled={busy} className="action-button-primary"><Plus size={19} aria-hidden="true"/> Добавить карту</button>{message && <p role="status" className="notice min-w-0">{message}</p>}</div>
    </form>
    <div className="grid min-w-0 gap-5 xl:grid-cols-3">
      {columns.map(group=>{const Icon=group.icon;const items=cards.filter(card=>card.type===group.type);return <section key={group.type} className="min-w-0 space-y-4"><div className="flex items-center gap-3 border-b border-[#334253] pb-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${group.tone}`}><Icon size={20} aria-hidden="true"/></span><h3 className="font-bold text-[#f1eee9]">{typeLabels[group.type]}</h3><span className="ml-auto rounded-lg bg-[#243444] px-2.5 py-1 text-xs font-bold tabular-nums text-[#d8e2ed]">{items.length}</span></div>
        {items.length ? items.map(card=><ExistingCard key={card.id} card={card}/>) : <p className="rounded-xl border border-dashed border-[#455367] px-4 py-7 text-center text-sm text-[#a1b3c4]">Карт пока нет</p>}
      </section>;})}
    </div>
  </section>;
}
