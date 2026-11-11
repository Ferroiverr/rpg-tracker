"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Crown, LayoutDashboard, ShieldCheck, UsersRound } from "lucide-react";

export default function AdminSidebar(){
  const path=usePathname();
  return <div className="admin-sidebar-inner space-y-7">
    <div className="rounded-xl border border-[#5a472f] bg-[linear-gradient(140deg,#362a1f,#202630)] p-4"><div className="mb-3 flex items-center gap-2 text-[#e9c38b]"><Crown size={22} aria-hidden="true"/><span className="text-xs font-extrabold uppercase tracking-[.14em]">Режим ведущего</span></div><p className="text-sm leading-6 text-[#d3c6b8]">Управление кампанией и её героями.</p></div>
    <nav aria-label="Навигация администратора" className="space-y-2">
      <p className="eyebrow mb-3 px-3">Рабочая область</p>
      <Link className="admin-nav-item" href="/admin" aria-current={path==="/admin"?"page":undefined}><LayoutDashboard aria-hidden="true"/> Обзор <ChevronRight size={15} className="ml-auto opacity-50" aria-hidden="true"/></Link>
      <Link className="admin-nav-item" href="/admin#moderation"><ShieldCheck aria-hidden="true"/> Модерация</Link>
      <Link className="admin-nav-item" href="/admin#roster" aria-current={path.startsWith("/admin/characters")?"page":undefined}><UsersRound aria-hidden="true"/> Персонажи</Link>
    </nav>
    <div className="divider"/>
    <p className="px-3 text-xs leading-6 text-[#8599ae]">Все изменения характеристик и статусов сохраняются в журнале событий.</p>
  </div>;
}
