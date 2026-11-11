import Link from "next/link";
import { ArrowUpRight, BookOpenText, CircleDot, ScrollText, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import CharacterDirectory from "@/components/CharacterDirectory";
import { createClient } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {data,error} = await supabase.from("characters").select("*").eq("status","approved").order("created_at",{ascending:false});
  const characters = (data || []) as Character[];
  const withArmor = characters.filter(c=>c.armor>0).length;
  const wounded = characters.filter(c=>c.current_hp<c.max_hp).length;

  return <><SiteHeader/><RealtimeRefresh/>
    <main className="page-shell space-y-7 lg:space-y-9">
      <section className="relative overflow-hidden rounded-[1.4rem] border border-[#45513f] bg-[linear-gradient(125deg,#1e2b35_0%,#15212c_48%,#181f29_100%)] px-6 py-7 sm:px-9 sm:py-9 xl:px-12 xl:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-48 h-96 w-96 rounded-full border border-[#94754d]/25 shadow-[0_0_0_48px_rgba(175,135,82,.035),0_0_0_96px_rgba(175,135,82,.025)]"/>
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl"><p className="eyebrow mb-3 flex items-center gap-2"><Sparkles size={16} aria-hidden="true"/> Все герои одной кампании</p><h1 className="page-title">Хроники персонажей</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[#c3ced9] sm:text-base">Здоровье, защита и карты героев — в одном живом реестре. Изменения администратора видны всем участникам.</p></div>
          <div className="flex shrink-0 flex-wrap items-center gap-3"><span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#4c705e] bg-[#21382e] px-4 text-sm font-bold text-[#a9e8bd]"><CircleDot size={16} aria-hidden="true"/> Данные обновляются</span><Link href="/dashboard" className="action-button-primary"><ArrowUpRight size={19} aria-hidden="true"/> Мои персонажи</Link></div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-tile"><div className="stat-tile-icon"><UsersRound size={22} aria-hidden="true"/></div><div className="min-w-0"><p className="stat-tile-label">Персонажей в реестре</p><p className="stat-tile-value">{characters.length}</p></div></div>
        <div className="stat-tile"><div className="stat-tile-icon !border-[#426859] !bg-[#203b30] !text-[#91d4af]"><ShieldCheck size={22} aria-hidden="true"/></div><div className="min-w-0"><p className="stat-tile-label">С активной бронёй</p><p className="stat-tile-value">{withArmor}</p></div></div>
        <div className="stat-tile"><div className="stat-tile-icon !border-[#6e4653] !bg-[#40232b] !text-[#eaa4aa]"><ScrollText size={22} aria-hidden="true"/></div><div className="min-w-0"><p className="stat-tile-label">Ранены в данный момент</p><p className="stat-tile-value">{wounded}</p></div></div>
      </div>
      <div className="flex flex-wrap items-center gap-4"><BookOpenText size={21} className="text-[#e4ba80]" aria-hidden="true"/><h2 className="section-title">Все персонажи</h2><span className="heading-rule"/></div>
      {error && <p role="alert" className="notice notice-error">Не удалось загрузить персонажей: {error.message}</p>}
      {!error && characters.length===0 && <div className="surface flex flex-col items-center gap-3 p-12 text-center"><ScrollText size={36} className="text-[#e0b781]" aria-hidden="true"/><h2 className="section-title">Реестр пока пуст</h2><p className="subtle">Одобренные заявки появятся здесь.</p></div>}
      {!error && characters.length>0 && <CharacterDirectory characters={characters}/>}
    </main>
  </>;
}
