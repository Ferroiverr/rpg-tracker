import { ClipboardCheck, Clock3, Crown, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CharacterPortrait from "@/components/CharacterPortrait";
import AdminCharacterTable from "@/components/AdminCharacterTable";
import type { Character } from "@/lib/types";
import ModerationButtons from "./ModerationButtons";

export default async function AdminPage(){
  const supabase=await createClient();
  const {data,error}=await supabase.from("characters").select("*").order("created_at",{ascending:false});
  const characters=(data||[]) as Character[];
  const pending=characters.filter(c=>c.status==="pending");
  const approved=characters.filter(c=>c.status==="approved");
  const archived=characters.filter(c=>c.status==="archived");
  return <main className="page-shell space-y-9">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow flex items-center gap-2"><Crown size={16} aria-hidden="true"/> Панель ведущего</p><h1 className="page-title mt-2">Управление кампанией</h1><p className="subtle mt-3">Заявки, характеристики, карты и история — без лишних переходов.</p></div><span className="rounded-xl border border-[#695637] bg-[#34291d] px-4 py-3 text-sm font-bold text-[#e6c08b]">Администратор</span></header>
    {error && <p role="alert" className="notice notice-error">Ошибка загрузки: {error.message}. Проверьте политики Supabase.</p>}
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Статистика кампании">
      <div className="stat-tile"><span className="stat-tile-icon"><Clock3 size={23}/></span><div><p className="stat-tile-label">Ждут модерации</p><p className="stat-tile-value">{pending.length}</p></div></div>
      <div className="stat-tile"><span className="stat-tile-icon !border-[#49745d] !bg-[#1a4031] !text-[#a2e4bc]"><ClipboardCheck size={23}/></span><div><p className="stat-tile-label">Одобрены</p><p className="stat-tile-value">{approved.length}</p></div></div>
      <div className="stat-tile"><span className="stat-tile-icon !border-[#465b70] !bg-[#1c3548] !text-[#b5d8f2]"><UsersRound size={23}/></span><div><p className="stat-tile-label">Всего анкет</p><p className="stat-tile-value">{characters.length}</p></div></div>
      <div className="stat-tile"><span className="stat-tile-icon !border-[#566071] !bg-[#2a3543] !text-[#ced9e5]"><ScrollText size={23}/></span><div><p className="stat-tile-label">В архиве</p><p className="stat-tile-value">{archived.length}</p></div></div>
    </section>
    <section id="moderation" className="scroll-mt-8 space-y-5">
      <div className="flex flex-wrap items-center gap-3"><ShieldCheck size={22} className="text-[#e3b77d]" aria-hidden="true"/><h2 className="section-title">Ожидают решения</h2><span className="rounded-full border border-[#66533b] bg-[#322718] px-3 py-1 text-xs font-bold text-[#ebc38e]">{pending.length}</span><span className="heading-rule"/></div>
      {!pending.length ? <div className="surface flex flex-wrap items-center gap-3 p-6 text-sm text-[#b2c5d4]"><ClipboardCheck size={22} className="text-[#8ed9ae]"/> Все заявки обработаны.</div> : <div className="grid gap-4 2xl:grid-cols-2">
        {pending.map(c=><article key={c.id} className="surface min-w-0 p-5 sm:p-6"><div className="flex min-w-0 items-start gap-4"><CharacterPortrait src={c.image_url} alt={c.name} size="medium"/><div className="min-w-0 flex-1"><h3 className="break-words text-lg font-bold text-[#f5eee4]">{c.name}</h3><p className="mt-2 text-sm text-[#b9c9d8]">Максимум HP: <strong className="number text-[#f7e0b7]">{c.max_hp}</strong></p><time dateTime={c.created_at} className="mt-2 block text-xs text-[#93a8ba]">Подана: {new Date(c.created_at).toLocaleString("ru-RU")}</time></div></div><div className="divider my-4"/><ModerationButtons id={c.id} status={c.status}/></article>)}
      </div>}
    </section>
    <section id="roster" className="scroll-mt-8 space-y-5"><div className="flex flex-wrap items-center gap-3"><UsersRound size={23} className="text-[#e3b77d]" aria-hidden="true"/><h2 className="section-title">Все персонажи</h2><span className="heading-rule"/></div><AdminCharacterTable characters={characters}/></section>
  </main>;
}
