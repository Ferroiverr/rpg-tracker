import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText, HeartPlus, Shield, Swords } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import CharacterVitals from "@/components/CharacterVitals";
import ActionHistory from "@/components/ActionHistory";
import { createClient } from "@/lib/supabase/server";
import type { Character, CharacterCard, CharacterAction, CardType } from "@/lib/types";

const groups: {type:CardType;title:string;note:string;icon:typeof Swords;accent:string}[] = [
  {type:"attack",title:"Урон",note:"Атакующие карты",icon:Swords,accent:"action-badge-damage"},
  {type:"defense",title:"Защита",note:"Защитные карты",icon:Shield,accent:"action-badge-defense"},
  {type:"healing",title:"Лечение",note:"Карты восстановления",icon:HeartPlus,accent:"action-badge-heal"},
];

export default async function CharacterPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data,error}=await supabase.from("characters").select("*").eq("id",id).maybeSingle();
  if(error||!data) notFound();
  const char=data as Character;
  const [{data:cardData},{data:actionData}]=await Promise.all([
    supabase.from("character_cards").select("*").eq("character_id",id).order("created_at"),
    supabase.from("character_actions").select("*").eq("character_id",id).order("created_at",{ascending:false}).limit(30),
  ]);
  const cards=(cardData||[]) as CharacterCard[];
  const actions=(actionData||[]) as CharacterAction[];
  return <><SiteHeader/><RealtimeRefresh/>
    <main className="page-shell space-y-7 lg:space-y-9">
      <Link href="/" className="text-link"><ArrowLeft size={18} aria-hidden="true"/> Вернуться к персонажам</Link>
      <section className="surface flex flex-col items-start gap-7 p-5 sm:flex-row sm:p-7 xl:gap-10 xl:p-9">
        <div className="w-full max-w-[180px] shrink-0 sm:max-w-[220px] xl:max-w-[245px]"><CharacterPortrait src={char.image_url} alt={char.name} size="large"/></div>
        <div className="min-w-0 flex-1 space-y-5">
          <div><p className="eyebrow mb-2">Личное досье</p><CharacterStatus status={char.status}/><h1 className="page-title mt-4 break-words">{char.name}</h1><p className="subtle mt-2">Портрет можно открыть в полном размере нажатием.</p></div>
          <div className="surface-soft max-w-2xl p-5 sm:p-6"><CharacterVitals character={char}/></div>
        </div>
      </section>
      <section className="space-y-5">
        <div className="flex items-center gap-3"><BookOpenText className="shrink-0 text-[#e3b980]" size={24} aria-hidden="true"/><h2 className="section-title">Колода персонажа</h2><span className="heading-rule"/><span className="rounded-full border border-[#47576a] px-3 py-1 text-sm font-bold tabular-nums text-[#e7cd9f]">{cards.length}</span></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map(group=>{
            const items=cards.filter(card=>card.type===group.type);
            const Icon=group.icon;
            return <section key={group.type} className="surface min-w-0 overflow-hidden">
              <div className="flex min-w-0 items-center gap-3 border-b border-[#304052] px-5 py-5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${group.accent}`}><Icon size={21} aria-hidden="true"/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#f5efe5]">{group.title}</h3><p className="text-xs text-[#a5b5c5]">{group.note}</p></div><span className="rounded-lg border border-[#435265] bg-[#1e2b38] px-2.5 py-1 font-bold tabular-nums text-[#e8d2ac]">{items.length}</span></div>
              <div className="space-y-3 p-4 sm:p-5">
                {items.length ? items.map(card=><article key={card.id} className="game-card"><h4 className="font-bold text-[#f6eddd]">{card.name}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#afc0d0]">{card.description||"Описание не добавлено"}</p></article>) : <p className="rounded-lg border border-dashed border-[#415166] px-4 py-7 text-center text-sm text-[#92a5b7]">Карт пока нет</p>}
              </div>
            </section>;
          })}
        </div>
      </section>
      <ActionHistory actions={actions}/>
    </main>
  </>;
}
