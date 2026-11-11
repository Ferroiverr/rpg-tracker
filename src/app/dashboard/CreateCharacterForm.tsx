"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, ImagePlus, ScrollText, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const allowed:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};

export default function CreateCharacterForm(){
  const [name,setName]=useState("");
  const [maxHp,setMaxHp]=useState(20);
  const [image,setImage]=useState<File|null>(null);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const imageInput=useRef<HTMLInputElement>(null);
  const router=useRouter();
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!name.trim()||name.trim().length>100){setMessage("Имя должно содержать от 1 до 100 символов");return;}
    if(!Number.isInteger(maxHp)||maxHp<1||maxHp>100000){setMessage("HP должно быть от 1 до 100000");return;}
    if(!image||!allowed[image.type]){setMessage("Выберите JPEG, PNG или WebP");return;}
    if(image.size>3*1024*1024){setMessage("Изображение больше 3 МБ");return;}
    setLoading(true);setMessage("");
    const supabase=createClient();
    let uploadedPath:string|null=null;
    try{
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user)throw new Error("Нужно войти в аккаунт");
      const path=`${user.id}/${crypto.randomUUID()}.${allowed[image.type]}`;
      const {error:uploadError}=await supabase.storage.from("character-images").upload(path,image,{contentType:image.type,upsert:false});
      if(uploadError)throw uploadError;
      uploadedPath=path;
      const {data:urlData}=supabase.storage.from("character-images").getPublicUrl(path);
      const {error}=await supabase.from("characters").insert({user_id:user.id,name:name.trim(),max_hp:maxHp,current_hp:maxHp,armor:0,image_url:urlData.publicUrl,image_path:path,status:"pending"});
      if(error)throw error;
      setMessage("Заявка отправлена! Администратор увидит её в очереди модерации.");setName("");setMaxHp(20);setImage(null);
      if(imageInput.current)imageInput.current.value="";
      router.refresh();
    } catch(error:unknown){
      if(uploadedPath)await supabase.storage.from("character-images").remove([uploadedPath]);
      setMessage(error instanceof Error?error.message:"Ошибка отправки заявки");
    } finally{setLoading(false);}
  }
  return <form onSubmit={submit} className="space-y-5">
    <label className="field-label"><span className="flex items-center gap-2"><ScrollText size={17} aria-hidden="true"/> Имя персонажа</span><input className="control mt-2" value={name} onChange={e=>setName(e.target.value)} maxLength={100} required placeholder="Например, Элира"/></label>
    <label className="field-label"><span className="flex items-center gap-2"><HeartPulse size={17} aria-hidden="true"/> Максимальное здоровье</span><input className="control mt-2" type="number" min={1} max={100000} step={1} value={maxHp} onChange={e=>setMaxHp(Number(e.target.value))} required/></label>
    <label className="field-label"><span className="flex items-center gap-2"><ImagePlus size={18} aria-hidden="true"/> Портрет персонажа</span><input ref={imageInput} className="control mt-2 cursor-pointer !py-2" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>setImage(e.target.files?.[0]??null)}/><span className="mt-2 block text-xs font-normal text-[#92a6ba]">JPEG, PNG или WebP, не более 3 МБ.</span></label>
    {message && <p role="status" className="notice">{message}</p>}
    <button disabled={loading} className="action-button-primary !min-h-[54px] w-full"><Send size={19} aria-hidden="true"/>{loading?"Отправка заявки…":"Отправить на модерацию"}</button>
  </form>;
}
