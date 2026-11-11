"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, UsersRound, X } from "lucide-react";
import type { Character, CharacterStatus } from "@/lib/types";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatusBadge from "@/components/CharacterStatus";

export default function AdminCharacterTable({characters}:{characters:Character[]}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<CharacterStatus|"all">("all");
  const rows=useMemo(()=>characters.filter(c=>(filter==="all"||c.status===filter) && c.name.toLocaleLowerCase("ru-RU").includes(search.trim().toLocaleLowerCase("ru-RU"))),[characters,filter,search]);
  return <div className="surface overflow-hidden">
    <div className="flex flex-col gap-4 border-b border-[#344354] px-4 py-5 sm:px-6 xl:flex-row xl:items-end xl:justify-between">
      <label className="min-w-0 flex-1"><span className="field-label mb-2 flex items-center gap-2"><Search size={16}/> Найти персонажа</span><div className="relative max-w-[620px]"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9cafc0]" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Имя персонажа…" className="control pl-11 pr-12"/>{search && <button type="button" aria-label="Сбросить поиск" onClick={()=>setSearch("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg hover:bg-[#263648]"><X size={16}/></button>}</div></label>
      <label className="min-w-[200px]"><span className="field-label mb-2 flex items-center gap-2"><SlidersHorizontal size={16}/> Статус</span><select className="control" value={filter} onChange={e=>setFilter(e.target.value as CharacterStatus|"all")}><option value="all">Все статусы</option><option value="approved">Одобренные</option><option value="pending">На модерации</option><option value="rejected">Отклонённые</option><option value="archived">Архив</option></select></label>
      <div aria-live="polite" className="flex min-h-12 items-center gap-2 rounded-xl border border-[#415163] px-4 text-sm text-[#c4d0dc]"><UsersRound size={17} className="text-[#e4bb80]"/><strong className="number text-[#f3e0bc]">{rows.length}</strong> из {characters.length}</div>
    </div>
    <div className="directory-header"><span>Персонаж</span><span>Статус</span><span>HP / Броня</span><span className="text-right">Действия</span></div>
    {!rows.length ? <div className="p-9 text-center text-sm text-[#a7b7c7]">Нет персонажей по выбранным условиям.</div> : rows.map(c=><article key={c.id} className="directory-row">
      <div className="directory-character"><CharacterPortrait src={c.image_url} alt={c.name} size="small"/><div className="min-w-0"><Link href={`/admin/characters/${c.id}`} className="block break-words font-bold text-[#eff3f6] hover:text-[#eac28c]">{c.name}</Link><span className="mt-1 block text-xs text-[#8296aa]">Заявка: {new Date(c.created_at).toLocaleDateString("ru-RU")}</span></div></div>
      <div className="directory-hp"><CharacterStatusBadge status={c.status}/></div>
      <div className="directory-armor space-y-1"><strong className="number block text-sm text-[#edf3f7]">{c.current_hp} / {c.max_hp} HP</strong><span className="block text-xs text-[#aac8dd]">Броня: <b className="number">{c.armor}</b></span></div>
      <div className="directory-action"><Link href={`/admin/characters/${c.id}`} className="action-button-quiet" aria-label={`Управлять персонажем ${c.name}`}><span className="mobile-action-label">Управлять</span><ArrowRight size={18} aria-hidden="true"/></Link></div>
    </article>)}
  </div>;
}
