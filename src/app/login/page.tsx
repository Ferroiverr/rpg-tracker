"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpenText, LockKeyhole, Mail, UserRound, UserRoundPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm(){
  const [mode,setMode]=useState<"login"|"register">("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [username,setUsername]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const params=useSearchParams();
  const router=useRouter();
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage("");setLoading(true);
    const supabase=createClient();
    try{
      if(mode==="login"){
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error)throw error;
        router.replace("/dashboard");router.refresh();
      } else {
        if(!username.trim())throw new Error("Укажите имя пользователя");
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username:username.trim()},emailRedirectTo:`${window.location.origin}/auth/confirm`}});
        if(error)throw error;
        if(data.session){router.replace("/dashboard");router.refresh();}
        else{setMessage("Проверьте почту и подтвердите адрес, затем войдите в аккаунт.");setMode("login");}
      }
    } catch(error:unknown){setMessage(error instanceof Error?error.message:"Не удалось выполнить операцию");}
    finally{setLoading(false);}
  }
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10 sm:px-7">
    <Link href="/" className="flex items-center gap-3"><span className="stat-tile-icon !h-14 !w-14"><BookOpenText size={27} aria-hidden="true"/></span><span className="text-2xl font-bold text-[#f5eee4]" style={{fontFamily:"Georgia,serif"}}>RPG <span className="text-[#dfb981]">Tracker</span></span></Link>
    <section className="surface w-full max-w-[530px] p-6 sm:p-9">
      <Link href="/" className="text-link"><ArrowLeft size={18} aria-hidden="true"/> К персонажам</Link>
      <div className="mt-7"><p className="eyebrow">Добро пожаловать</p><h1 className="page-title mt-2">{mode==="login"?"Войти в хроники":"Регистрация игрока"}</h1><p className="subtle mt-3">{mode==="login"?"Здесь начинается ваша кампания.":"Создайте учётную запись, чтобы отправить заявку на героя."}</p></div>
      <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl border border-[#334353] bg-[#111b26] p-1.5"><button type="button" onClick={()=>{setMode("login");setMessage("");}} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${mode==="login"?"bg-[#d6ad74] text-[#1b2027]":"text-[#aebfd0] hover:bg-[#263648]"}`}><LockKeyhole size={18} aria-hidden="true"/> Вход</button><button type="button" onClick={()=>{setMode("register");setMessage("");}} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${mode==="register"?"bg-[#d6ad74] text-[#1b2027]":"text-[#aebfd0] hover:bg-[#263648]"}`}><UserRoundPlus size={18} aria-hidden="true"/> Регистрация</button></div>
      {params.get("message")==="confirm-error" && <p role="alert" className="notice notice-error mt-5">Не удалось подтвердить адрес. Проверьте ссылку или повторите попытку.</p>}
      <form onSubmit={submit} className="mt-7 space-y-5">
        {mode==="register" && <label className="field-label"><span className="flex items-center gap-2"><UserRound size={16} aria-hidden="true"/> Никнейм</span><input className="control mt-2" value={username} onChange={e=>setUsername(e.target.value)} maxLength={50} autoComplete="nickname" required placeholder="Как к вам обращаться"/></label>}
        <label className="field-label"><span className="flex items-center gap-2"><Mail size={16} aria-hidden="true"/> Email</span><input className="control mt-2" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"/></label>
        <label className="field-label"><span className="flex items-center gap-2"><LockKeyhole size={16} aria-hidden="true"/> Пароль</span><input className="control mt-2" type="password" minLength={6} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Не менее 6 символов"/></label>
        {message && <p role="status" className="notice">{message}</p>}
        <button disabled={loading} className="action-button-primary !min-h-[54px] w-full"><LockKeyhole size={19} aria-hidden="true"/>{loading?"Пожалуйста, подождите…":mode==="login"?"Войти в аккаунт":"Создать аккаунт"}</button>
      </form>
    </section>
    <p className="text-center text-xs text-[#7c90a4]">Персонажи · Здоровье · Карты · Хроники кампании</p>
  </main>;
}

export default function LoginPage(){return <Suspense fallback={<div className="page-shell">Загрузка формы…</div>}><LoginForm/></Suspense>;}
