import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Crown, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import CharacterVitals from "@/components/CharacterVitals";
import type { Character, CharacterCard } from "@/lib/types";
import ModerationButtons from "../../ModerationButtons";
import AdminCharacterActions from "./AdminCharacterActions";
import CardManager from "./CardManager";

export default async function AdminCharacterPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const {data,error}=await supabase.from("characters").select("*").eq("id",id).maybeSingle();
  if(error||!data)notFound();
  const character=data as Character;
  const {data:cardData}=await supabase.from("character_cards").select("*").eq("character_id",id).order("created_at",{ascending:true});
  const cards=(cardData||[]) as CharacterCard[];
  return <main className="page-shell space-y-7 lg:space-y-9">
    <Link href="/admin#roster" className="text-link"><ArrowLeft size={18} aria-hidden="true"/> Вернуться к списку персонажей</Link>
    <section className="surface flex flex-col gap-6 p-5 sm:flex-row sm:p-7 xl:gap-9 xl:p-9">
      <div className="w-full max-w-[160px] shrink-0 sm:max-w-[190px]"><CharacterPortrait src={character.image_url} alt={character.name} size="large"/></div>
      <div className="min-w-0 flex-1 space-y-5">
        <div><p className="eyebrow flex items-center gap-2"><Crown size={16} aria-hidden="true"/> Управление героем</p><h1 className="page-title mt-3">{character.name}</h1><div className="mt-3"><CharacterStatus status={character.status}/></div></div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="surface-soft p-5"><CharacterVitals character={character}/></div>
          <div className="space-y-4"><p className="subtle">Изменения характеристик сохраняются в журнале действий и автоматически отображаются у игроков.</p><div className="flex flex-wrap items-center gap-3"><Link href={`/character/${character.id}`} className="action-button-quiet"><ArrowUpRight size={19} aria-hidden="true"/> Публичное досье</Link><ModerationButtons id={character.id} status={character.status}/></div></div>
        </div>
      </div>
    </section>
    <div className="flex items-center gap-3"><ShieldCheck size={23} className="text-[#e3b77d]"/><h2 className="section-title">Инструменты ведущего</h2><span className="heading-rule"/></div>
    <AdminCharacterActions character={character}/>
    <CardManager characterId={character.id} cards={cards}/>
  </main>;
}
