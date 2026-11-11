import { Archive, CheckCheck, Clock3, Heart, ScrollText, Shield, Sword, X } from "lucide-react";
import { actionLabel, type CharacterAction } from "@/lib/types";

const themes: Record<string,{ badge: string; icon: typeof Sword; label: string }> = {
  damage: {badge:"action-badge-damage",icon:Sword,label:"Урон"},
  heal: {badge:"action-badge-heal",icon:Heart,label:"Лечение"},
  set_armor: {badge:"action-badge-defense",icon:Shield,label:"Защита"},
  status_approved: {badge:"action-badge-heal",icon:CheckCheck,label:"Модерация"},
  status_rejected: {badge:"action-badge-damage",icon:X,label:"Модерация"},
  status_archived: {badge:"action-badge-neutral",icon:Archive,label:"Архив"},
};

export default function ActionHistory({actions}:{actions:CharacterAction[]}) {
  return <section className="surface overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#304052] px-5 py-5 sm:px-7">
      <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#6b5336] bg-[#372b20] text-[#e0bc88]"><ScrollText size={21} aria-hidden="true"/></span><div><p className="eyebrow">Лента событий</p><h2 className="section-title mt-1">История действий</h2></div></div>
      <span className="rounded-full border border-[#3b4a5b] bg-[#1c2a37] px-3.5 py-2 text-xs font-bold text-[#c3d0dd]">Последние {actions.length} записей</span>
    </div>
    {!actions.length ? <p className="subtle px-6 py-9">Действий пока нет.</p> : <ol className="divide-y divide-[#2b3948]">
      {actions.map(action=>{
        const theme=themes[action.action_type] ?? {badge:"action-badge-neutral",icon:Clock3,label:"Событие"};
        const Icon=theme.icon;
        const withAmount=["damage","heal","set_armor"].includes(action.action_type);
        return <li key={action.id} className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-4 px-4 py-5 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-5 sm:px-7">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border sm:h-12 sm:w-12 ${theme.badge}`}><Icon size={20} aria-hidden="true"/></span>
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-2">
              <div className="min-w-0"><p className="mb-1 text-[.68rem] font-bold uppercase tracking-[.13em] text-[#9eafc0]">{theme.label}</p><h3 className="break-words text-base font-bold leading-6 text-[#f0f4f6]">{actionLabel(action.action_type)}{withAmount && <span className="ml-2 inline-block rounded-md bg-[#283747] px-2.5 py-0.5 font-extrabold tabular-nums text-[#f4d5a3]">{action.action_type==="heal"?"+":action.action_type==="damage"?"−":""}{action.amount}</span>}</h3></div>
              <time dateTime={action.created_at} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#334050] bg-[#18232f] px-3 py-2 text-xs leading-5 text-[#b5c4d3]"><Clock3 size={15} className="shrink-0" aria-hidden="true"/><span className="break-words">{new Date(action.created_at).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></time>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#304457] bg-[#14212f] px-3 py-2 text-sm text-[#bed0df]"><Heart size={15} className="shrink-0 text-[#8bdbaf]" aria-hidden="true"/> HP <strong className="number text-[#f1f5f6]">{action.hp_before} → {action.hp_after}</strong></span>
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#304457] bg-[#14212f] px-3 py-2 text-sm text-[#bed0df]"><Shield size={15} className="shrink-0 text-[#a0d0ef]" aria-hidden="true"/> Броня <strong className="number text-[#f1f5f6]">{action.armor_before} → {action.armor_after}</strong></span>
              {action.blocked_amount>0 && <span className="rounded-lg border border-[#47718a] bg-[#1a3649] px-3 py-2 text-xs font-semibold text-[#b2ddfa]">Поглощено: <strong className="number">{action.blocked_amount}</strong></span>}
            </div>
            {action.note && <p className="min-w-0 whitespace-pre-wrap break-words border-l-2 border-[#b68b55] pl-3 text-sm leading-6 text-[#b9c7d3]">{action.note}</p>}
          </div>
        </li>;
      })}
    </ol>}
  </section>;
}
