import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({children}:Readonly<{children:React.ReactNode}>){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:allowed,error}=await supabase.rpc("is_admin");
  if(error||allowed!==true) redirect("/dashboard");
  return <><SiteHeader/><RealtimeRefresh/><div className="admin-workspace"><aside className="admin-sidebar"><AdminSidebar/></aside><div className="admin-main">{children}</div></div></>;
}
