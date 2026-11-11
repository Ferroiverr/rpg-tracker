import Link from "next/link";
import { BookOpenText, Crown, LogIn, LogOut, Shield, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  const {data:isAdmin} = user ? await supabase.rpc("is_admin") : {data:false};

  return <header className="relative z-20 border-b border-[#293748] bg-[#0e1620]/95 shadow-[0_12px_40px_rgba(0,0,0,.12)]">
    <nav aria-label="Основная навигация" className="mx-auto flex w-full max-w-[1920px] flex-col gap-4 px-5 py-4 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:gap-10 xl:px-14">
      <Link href="/" className="flex w-fit items-center gap-3.5" aria-label="RPG Tracker — на главную">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#816341] bg-[#392c20] text-[#f0c88b]"><BookOpenText size={25} aria-hidden="true"/></span>
        <span className="min-w-0 text-[1.28rem] font-bold leading-tight tracking-tight text-[#f4eee5]" style={{fontFamily:"Georgia,serif"}}>RPG <span className="text-[#e1b981]">Tracker</span><small className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[.19em] text-[#97a7b6]">Хроники кампании</small></span>
      </Link>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <Link href="/" className="action-button-quiet !min-h-11 !px-4"><UsersRound size={19} aria-hidden="true"/> Персонажи</Link>
        {user && <Link href="/dashboard" className="action-button-quiet !min-h-11 !px-4"><Shield size={18} aria-hidden="true"/> Мои герои</Link>}
        {isAdmin && <Link href="/admin" className="action-button-primary !min-h-11 !px-4"><Crown size={19} aria-hidden="true"/> Админка</Link>}
        {user ? <form action="/auth/signout" method="post"><button type="submit" className="action-button-quiet !min-h-11 !px-4"><LogOut size={18} aria-hidden="true"/> Выйти</button></form> : <Link href="/login" className="action-button-primary !min-h-11 !px-4"><LogIn size={18} aria-hidden="true"/> Войти</Link>}
      </div>
    </nav>
  </header>;
}
