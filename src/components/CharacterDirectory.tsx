"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, HeartPulse, LayoutList, Search, Shield, UsersRound, X } from "lucide-react";
import type { Character } from "@/lib/types";
import CharacterPortrait from "@/components/CharacterPortrait";

export default function CharacterDirectory({ characters }: { characters: Character[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "name" | "hp">("new");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ru-RU");
    const result = characters.filter(char => char.name.toLocaleLowerCase("ru-RU").includes(term));
    if (sort === "name") result.sort((a,b) => a.name.localeCompare(b.name,"ru-RU"));
    else if (sort === "hp") result.sort((a,b) => b.current_hp - a.current_hp);
    return result;
  }, [characters,search,sort]);

  return <section aria-label="Каталог персонажей" className="min-w-0 space-y-4">
    <div className="surface flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1">
        <label htmlFor="character-search" className="field-label mb-2 flex items-center gap-2"><Search size={16} aria-hidden="true"/> Поиск по персонажам</label>
        <div className="relative max-w-[680px]">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#91a2b5]"/>
          <input id="character-search" className="control pl-11 pr-12" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Введите имя героя…"/>
          {!!search && <button type="button" aria-label="Очистить поиск" onClick={()=>setSearch("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#c7d3df] hover:bg-[#263648]"><X size={17}/></button>}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 sm:gap-5">
        <label className="min-w-[185px] flex-1 lg:flex-none"><span className="field-label mb-2 flex items-center gap-2"><ArrowUpDown size={16} aria-hidden="true"/> Сортировка</span>
          <select className="control" value={sort} onChange={e=>setSort(e.target.value as "new"|"name"|"hp")}>
            <option value="new">Сначала новые</option><option value="name">По алфавиту</option><option value="hp">Больше HP</option>
          </select>
        </label>
        <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-[#37485a] bg-[#111c28] px-4 text-sm text-[#b4c4d4]" aria-live="polite"><UsersRound size={18} aria-hidden="true"/><span className="number font-bold text-[#f5e3c7]">{filtered.length}</span> из {characters.length}</div>
      </div>
    </div>
    {filtered.length ? <div className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#354355] px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><LayoutList className="text-[#e0b67e]" size={20} aria-hidden="true"/><h2 className="min-w-0 font-bold text-[#f5eee3]">Реестр героев</h2></div>
        <span className="hidden text-xs text-[#8e9faf] sm:inline">Нажмите на портрет, чтобы увеличить</span>
      </div>
      <div className="directory-header" aria-hidden="true"><span>Персонаж</span><span>Здоровье</span><span>Броня</span><span className="text-right">Профиль</span></div>
      <div>
        {filtered.map(character => {
          const percent = character.max_hp > 0 ? Math.max(0,Math.min(100,character.current_hp / character.max_hp * 100)) : 0;
          return <article key={character.id} className="directory-row">
            <div className="directory-character">
              <CharacterPortrait src={character.image_url} alt={character.name} size="small"/>
              <div className="min-w-0"><Link href={`/character/${character.id}`} className="block break-words font-bold leading-snug text-[#eff3f6] hover:text-[#eac28c]">{character.name}</Link><p className="mt-1 text-xs text-[#8399ad]">Персонаж кампании</p></div>
            </div>
            <div className="directory-hp space-y-2"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><HeartPulse size={15} className="text-[#8ad4a9]" aria-hidden="true"/><strong className="number text-[#e2eee7]">{character.current_hp} / {character.max_hp}</strong><span className="text-xs text-[#8b9cab]">HP</span></div><div className="hp-track"><div className="hp-fill" style={{width:`${percent}%`}}/></div></div>
            <div className="directory-armor"><span className="inline-flex items-center gap-2 rounded-lg bg-[#203747] px-3 py-2 font-bold text-[#b2dbf3]"><Shield size={16} aria-hidden="true"/><span className="number">{character.armor}</span></span></div>
            <div className="directory-action"><Link href={`/character/${character.id}`} className="action-button-quiet" aria-label={`Открыть профиль ${character.name}`}><span className="mobile-action-label">Открыть</span><ArrowRight size={18} aria-hidden="true"/></Link></div>
          </article>;
        })}
      </div>
    </div> : <div className="surface flex flex-col items-center gap-3 p-10 text-center"><Search size={32} className="text-[#d4ab74]"/><p className="font-bold">Персонажи не найдены</p><p className="subtle">Попробуйте другое имя или очистите поиск.</p><button type="button" onClick={()=>setSearch("")} className="action-button-quiet"><X size={17}/> Очистить поиск</button></div>}
  </section>;
}
