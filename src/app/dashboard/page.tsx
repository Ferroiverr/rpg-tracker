import { redirect } from "next/navigation";
import { CirclePlus, ScrollText, UsersRound } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import CharacterSummary from "@/components/CharacterSummary";
import { createClient } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";
import CreateCharacterForm from "./CreateCharacterForm";

export default async function DashboardPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data,error}=await supabase.from("characters").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  const characters=(data||[]) as Character[];
  return <><SiteHeader/><RealtimeRefresh/>
    <main className="page-shell space-y-7 lg:space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Личный раздел</p><h1 className="page-title mt-2">Мои персонажи</h1><p className="subtle mt-3">Анкеты, заявки и одобренные герои в одной коллекции.</p></div><span className="stat-tile !py-3"><UsersRound size={21} className="text-[#e0b77f]"/><span className="number text-xl font-bold">{characters.length}</span><span className="text-sm text-[#9eb0c0]">персонажей</span></span></header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(310px,380px)_minmax(0,1fr)] xl:gap-8">
        <section className="surface p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="stat-tile-icon"><CirclePlus size={23} aria-hidden="true"/></span><div><p className="eyebrow">Создание героя</p><h2 className="section-title mt-1">Новая заявка</h2></div></div><p className="subtle mb-6">Персонаж появится в общем реестре после одобрения ведущим.</p><CreateCharacterForm/></section>
        <section className="min-w-0 space-y-5"><div className="flex items-center gap-3"><h2 className="section-title">Мои герои</h2><span className="heading-rule"/></div>
          {error && <p role="alert" className="notice notice-error">{error.message}</p>}
          {!error && !characters.length && <div className="surface flex flex-col items-center gap-2 p-10 text-center"><ScrollText size={34} className="text-[#d3ae7b]"/><p className="font-bold">Пока нет персонажей</p><p className="subtle">Заполните заявку в форме рядом.</p></div>}
          <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {characters.map(char=><div key={char.id} className="min-w-0 space-y-2"><CharacterSummary character={char} href={char.status==="approved"?`/character/${char.id}`:undefined}/>{char.status==="rejected" && <p className="text-sm text-[#e4a5ac]">Заявка отклонена. Можно отправить новую.</p>}</div>)}
          </div>
        </section>
      </div>
    </main>
  </>;
}
