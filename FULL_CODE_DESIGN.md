# RPG Tracker — полный код всех файлов редизайна

Это **полный**, а не фрагментарный листинг каждого изменённого или добавленного исходного файла.
Точки входа и операции базы из старой версии оставлены прежними. Всего исходных файлов в листинге: 19.

Для удобства проще распаковать ZIP: там файлы уже лежат на своих местах.

---

## `src/app/admin/ModerationButtons.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CharacterStatus } from "@/lib/types";

export default function ModerationButtons({ id, status }: { id: string; status: CharacterStatus }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function moderate(nextStatus: "approved" | "rejected" | "archived") {
    const messageForLog = nextStatus === "rejected" ? window.prompt("Причина отклонения (необязательно):", "") : "";
    if (messageForLog === null) return;
    if (nextStatus === "archived" && !window.confirm("Перевести персонажа в архив?")) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().rpc("moderate_character", {
        p_character_id: id,
        p_status: nextStatus,
        p_note: messageForLog || "",
      });
      if (error) throw error;
      router.refresh();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Ошибка изменения статуса");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {status !== "approved" && <button disabled={busy} onClick={() => void moderate("approved")} className="action-button-success">Одобрить</button>}
      {status === "pending" && <button disabled={busy} onClick={() => void moderate("rejected")} className="action-button-danger">Отклонить</button>}
      {status === "approved" && <button disabled={busy} onClick={() => void moderate("archived")} className="action-button-quiet">В архив</button>}
      {message && <p role="alert" className="w-full text-sm font-medium text-red-700">{message}</p>}
    </div>
  );
}
```

---

## `src/app/admin/characters/[id]/AdminCharacterActions.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPlus, Shield, Swords, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Character } from "@/lib/types";

export default function AdminCharacterActions({ character }: { character: Character }) {
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function apply(action: "damage" | "heal" | "set_armor") {
    if (!Number.isInteger(amount) || amount < (action === "set_armor" ? 0 : 1) || amount > 100000) {
      setMessage("Некорректное значение"); return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().rpc("apply_character_action", {
        p_character_id: character.id,
        p_action: action,
        p_amount: amount,
        p_note: note.trim(),
      });
      if (error) throw error;
      setNote("");
      setMessage("Изменение сохранено в истории");
      router.refresh();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить действие");
    } finally { setBusy(false); }
  }

  async function removeCharacter() {
    if (!window.confirm(`НАВСЕГДА удалить персонажа «${character.name}» со всеми картами и историей?`)) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    try {
      const { error } = await supabase.from("characters").delete().eq("id", character.id);
      if (error) throw error;
      if (character.image_path) {
        const { error: storageError } = await supabase.storage.from("character-images").remove([character.image_path]);
        if (storageError) console.error("Изображение не удалилось из Storage", storageError);
      }
      router.replace("/admin");
      router.refresh();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить персонажа");
    } finally { setBusy(false); }
  }

  return (
    <section className="surface p-5 sm:p-7">
      <h2 className="section-title">Управление характеристиками</h2>
      <p className="subtle mt-2">Действия доступны только для одобренных персонажей. При получении урона сначала расходуется броня.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
        <label className="field-label">Количество
          <input className="control mt-1.5" type="number" min={0} max={100000} step={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label className="field-label">Причина / комментарий
          <input className="control mt-1.5" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: атака или результат броска кубика" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={busy || character.status !== "approved"} onClick={() => void apply("damage")} className="action-button-danger"><Swords aria-hidden="true" size={17}/> Нанести урон</button>
        <button disabled={busy || character.status !== "approved"} onClick={() => void apply("heal")} className="action-button-success"><HeartPlus aria-hidden="true" size={17}/> Вылечить</button>
        <button disabled={busy || character.status !== "approved"} onClick={() => void apply("set_armor")} className="action-button-primary"><Shield aria-hidden="true" size={17}/> Установить броню</button>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-stone-200 bg-[#f8f6ef] p-3 text-sm font-medium text-[#45565a]">{message}</p>}
      <div className="mt-8 border-t border-stone-200 pt-5">
        <h3 className="text-sm font-bold text-[#97404c]">Опасная зона</h3>
        <p className="subtle mt-1 mb-3">Удаление необратимо: пропадут карты и вся история. Обычно безопаснее перевести героя в архив.</p>
        <button disabled={busy} onClick={() => void removeCharacter()} className="action-button-quiet border-red-200 text-red-700 hover:bg-red-50"><Trash2 aria-hidden="true" size={16}/> Удалить персонажа навсегда</button>
      </div>
    </section>
  );
}
```

---

## `src/app/admin/characters/[id]/CardManager.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPlus, Plus, Save, Shield, Swords, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CardType, CharacterCard } from "@/lib/types";

const typeLabels: Record<CardType, string> = { attack: "Урон", defense: "Защита", healing: "Лечение" };
const columns: { type: CardType; icon: typeof Swords; tone: string }[] = [
  { type: "attack", icon: Swords, tone: "text-rose-700 bg-rose-50" },
  { type: "defense", icon: Shield, tone: "text-sky-800 bg-sky-50" },
  { type: "healing", icon: HeartPlus, tone: "text-emerald-800 bg-emerald-50" },
];

function ExistingCard({ card }: { card: CharacterCard }) {
  const [name, setName] = useState(card.name);
  const [description, setDescription] = useState(card.description);
  const [type, setType] = useState<CardType>(card.type);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function save() {
    if (!name.trim() || name.trim().length > 100 || description.length > 2000) { setMessage("Проверьте длину названия и описания"); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().from("character_cards").update({ name: name.trim(), description, type }).eq("id", card.id);
      if (error) throw error;
      setMessage("Сохранено"); router.refresh();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm(`Удалить карту «${card.name}»?`)) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().from("character_cards").delete().eq("id", card.id);
      if (error) throw error;
      router.refresh();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  return (
    <div className="surface-soft min-w-0 space-y-3 p-3.5">
      <label className="field-label">Название карты
        <input aria-label="Название карты" className="control mt-1" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field-label">Категория
        <select aria-label="Категория карты" className="control mt-1" value={type} onChange={(e) => setType(e.target.value as CardType)}>
          {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="field-label">Описание
        <textarea aria-label="Описание карты" className="control mt-1 min-h-24 resize-y" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="action-button-primary flex-1" onClick={() => void save()}><Save aria-hidden="true" size={15}/> Сохранить</button>
        <button disabled={busy} className="action-button-quiet border-red-200 text-red-700" onClick={() => void remove()} aria-label={`Удалить карту ${card.name}`}><Trash2 aria-hidden="true" size={16}/></button>
      </div>
      {message && <p role="status" className="text-xs font-medium text-[#667278]">{message}</p>}
    </div>
  );
}

export default function CardManager({ characterId, cards }: { characterId: string; cards: CharacterCard[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CardType>("attack");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setMessage("Укажите название"); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().from("character_cards").insert({ character_id: characterId, type, name: name.trim(), description });
      if (error) throw error;
      setName(""); setDescription("");
      setMessage("Карта добавлена"); router.refresh();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Ошибка"); }
    finally { setBusy(false); }
  }

  return (
    <section className="surface p-5 sm:p-7">
      <h2 className="section-title">Карты персонажа</h2>
      <p className="subtle mt-2">Добавляйте карты в нужную категорию. Все одобренные персонажи и их карты видны игрокам.</p>
      <form className="surface-soft mt-5 grid gap-4 p-4 sm:grid-cols-2 sm:p-5" onSubmit={add}>
        <label className="field-label">Название
          <input className="control mt-1.5" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Название карты" />
        </label>
        <label className="field-label">Тип карты
          <select className="control mt-1.5" value={type} onChange={(e) => setType(e.target.value as CardType)}>
            {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field-label sm:col-span-2">Описание
          <textarea className="control mt-1.5 min-h-24 resize-y" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что делает карта?" />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={busy} className="action-button-primary"><Plus aria-hidden="true" size={17}/> Добавить карту</button>{message && <p role="status" className="text-sm text-[#52636b]">{message}</p>}</div>
      </form>
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {columns.map((column) => {
          const Icon = column.icon;
          const filtered = cards.filter((card) => card.type === column.type);
          return <div key={column.type} className="min-w-0 space-y-3">
            <h3 className="flex items-center gap-2 border-b border-stone-200 pb-3 font-bold"><span className={`grid h-8 w-8 place-items-center rounded-lg ${column.tone}`}><Icon aria-hidden="true" size={16}/></span>{typeLabels[column.type]} <span className="ml-auto text-xs font-normal text-[#7a8587]">{filtered.length}</span></h3>
            {filtered.length ? filtered.map((card) => <ExistingCard key={card.id} card={card} />) : <p className="rounded-xl border border-dashed border-stone-200 p-5 text-center text-sm text-[#8a9392]">Карт пока нет</p>}
          </div>;
        })}
      </div>
    </section>
  );
}
```

---

## `src/app/admin/characters/[id]/page.tsx`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import CharacterVitals from "@/components/CharacterVitals";
import type { Character, CharacterCard } from "@/lib/types";
import ModerationButtons from "../../ModerationButtons";
import AdminCharacterActions from "./AdminCharacterActions";
import CardManager from "./CardManager";

export default async function AdminCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("characters").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const character = data as Character;
  const { data: cardData } = await supabase.from("character_cards").select("*").eq("character_id", id).order("created_at", { ascending: true });
  const cards = (cardData || []) as CharacterCard[];

  return (
    <main className="page-shell space-y-6">
      <Link href="/admin" className="text-link"><ArrowLeft aria-hidden="true" size={16}/> Ко всем персонажам</Link>
      <section className="surface grid gap-5 p-5 sm:p-7 md:grid-cols-[190px_minmax(0,1fr)]">
        <CharacterPortrait src={character.image_url} alt={character.name} size="large" />
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-2"><Crown size={14} aria-hidden="true"/> Редактирование персонажа</p>
          <h1 className="page-title mt-2 break-words">{character.name}</h1>
          <div className="mt-3"><CharacterStatus status={character.status} /></div>
          <div className="surface-soft mt-5 max-w-lg p-4"><CharacterVitals character={character}/></div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2"><Link href={`/character/${character.id}`} className="text-link">Посмотреть профиль <ExternalLink aria-hidden="true" size={15}/></Link><ModerationButtons id={character.id} status={character.status}/></div>
        </div>
      </section>
      <AdminCharacterActions character={character} />
      <CardManager characterId={character.id} cards={cards} />
    </main>
  );
}
```

---

## `src/app/admin/page.tsx`

```tsx
import Link from "next/link";
import { ArrowUpRight, ClipboardList, Crown, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import type { Character } from "@/lib/types";
import ModerationButtons from "./ModerationButtons";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("characters").select("*").order("created_at", { ascending: false });
  const characters = (data || []) as Character[];
  const pending = characters.filter((c) => c.status === "pending");

  return (
    <main className="page-shell space-y-8">
      <header>
        <p className="eyebrow flex items-center gap-2"><Crown size={15} aria-hidden="true" /> Панель ведущего</p>
        <h1 className="page-title mt-2">Управление кампанией</h1>
        <p className="subtle mt-2">Одобрение заявок, управление характеристиками и картами героев.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Ошибка загрузки: {error.message}. Проверьте SQL-политики.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><ClipboardList size={24}/></span><div><p className="subtle">Ожидают решения</p><p className="text-3xl font-bold tabular-nums">{pending.length}</p></div></div>
        <div className="surface flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-[#485f68]"><UsersRound size={24}/></span><div><p className="subtle">Всего персонажей</p><p className="text-3xl font-bold tabular-nums">{characters.length}</p></div></div>
      </div>
      <section>
        <h2 className="section-title mb-4">Заявки на модерацию <span className="text-base font-normal text-[#758086]">({pending.length})</span></h2>
        {!pending.length && <p className="surface p-6 text-sm text-[#68767a]">Новых заявок пока нет.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((char) => (
            <article key={char.id} className="surface min-w-0 p-5">
              <div className="flex min-w-0 items-start gap-4">
                <CharacterPortrait src={char.image_url} alt={char.name} size="medium" />
                <div className="min-w-0 flex-1 space-y-2">
                  <CharacterStatus status={char.status} />
                  <h3 className="break-words text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>{char.name}</h3>
                  <p className="text-sm text-[#4e5c62]">Макс. HP: <b>{char.max_hp}</b></p>
                  <time className="block text-xs text-[#778184]" dateTime={char.created_at}>Заявка: {new Date(char.created_at).toLocaleString("ru-RU")}</time>
                </div>
              </div>
              <ModerationButtons id={char.id} status={char.status} />
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="section-title mb-4">Все персонажи <span className="text-base font-normal text-[#758086]">({characters.length})</span></h2>
        <div className="surface overflow-hidden">
          {characters.length === 0 ? <p className="p-6 text-sm text-[#68767a]">Список пуст.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-[#f8f6ef] text-xs uppercase tracking-wide text-[#69767a]"><tr><th className="p-4 font-semibold">Персонаж</th><th className="p-4 font-semibold">Статус</th><th className="p-4 font-semibold">Здоровье</th><th className="p-4 font-semibold">Броня</th><th className="p-4 font-semibold">Управление</th></tr></thead>
                <tbody className="divide-y divide-stone-200/80">
                  {characters.map((char) => <tr key={char.id} className="transition hover:bg-[#faf8f1]">
                    <td className="p-3 sm:p-4"><div className="flex min-w-0 items-center gap-3"><CharacterPortrait src={char.image_url} alt={char.name} size="small" /><span className="max-w-[210px] break-words font-bold text-[#26383f]">{char.name}</span></div></td>
                    <td className="p-4"><CharacterStatus status={char.status} /></td>
                    <td className="p-4 font-semibold tabular-nums">{char.current_hp} / {char.max_hp}</td>
                    <td className="p-4 font-semibold tabular-nums">{char.armor}</td>
                    <td className="p-4"><Link href={`/admin/characters/${char.id}`} className="text-link whitespace-nowrap">Управлять <ArrowUpRight size={15} aria-hidden="true"/></Link></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
```

---

## `src/app/character/[id]/page.tsx`

```tsx
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

const groups: { type: CardType; title: string; note: string; icon: typeof Swords; accent: string }[] = [
  { type: "attack", title: "Урон", note: "Атакующие карты", icon: Swords, accent: "text-rose-700 bg-rose-50 border-rose-200" },
  { type: "defense", title: "Защита", note: "Защитные карты", icon: Shield, accent: "text-sky-800 bg-sky-50 border-sky-200" },
  { type: "healing", title: "Лечение", note: "Карты восстановления", icon: HeartPlus, accent: "text-emerald-800 bg-emerald-50 border-emerald-200" },
];

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("characters").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const char = data as Character;
  const [{ data: cardData }, { data: actionData }] = await Promise.all([
    supabase.from("character_cards").select("*").eq("character_id", id).order("created_at"),
    supabase.from("character_actions").select("*").eq("character_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  const cards = (cardData || []) as CharacterCard[];
  const actions = (actionData || []) as CharacterAction[];

  return (
    <>
      <SiteHeader /><RealtimeRefresh />
      <main className="page-shell space-y-7">
        <Link href="/" className="text-link"><ArrowLeft size={16} aria-hidden="true"/> Ко всем персонажам</Link>
        <section className="surface grid gap-6 p-5 sm:p-7 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
          <CharacterPortrait src={char.image_url} alt={char.name} size="large" />
          <div className="min-w-0">
            <p className="eyebrow mb-2">Досье персонажа</p>
            <CharacterStatus status={char.status}/>
            <h1 className="page-title mt-3 break-words">{char.name}</h1>
            <p className="subtle mt-2">Нажмите на портрет, чтобы открыть изображение крупнее.</p>
            <div className="surface-soft mt-6 max-w-lg p-4 sm:p-5"><CharacterVitals character={char}/></div>
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-center gap-2"><BookOpenText aria-hidden="true" size={22} className="text-[#a58151]"/><h2 className="section-title">Карты персонажа</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {groups.map((g) => {
              const filtered = cards.filter((card) => card.type === g.type);
              const Icon = g.icon;
              return (
                <section key={g.type} className="surface min-w-0 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#eee9df] pb-4">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${g.accent}`}><Icon size={19} aria-hidden="true"/></span>
                    <div className="min-w-0"><h3 className="text-lg font-bold" style={{fontFamily:"Georgia, serif"}}>{g.title} <span className="text-sm font-normal text-[#778080]">({filtered.length})</span></h3><p className="text-xs text-[#788286]">{g.note}</p></div>
                  </div>
                  {filtered.length ? <div className="space-y-3">
                    {filtered.map((card) => <article key={card.id} className="surface-soft min-w-0 p-4"><h4 className="break-words font-bold text-[#28353c]">{card.name}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#617075]">{card.description || "Описание не добавлено"}</p></article>)}
                  </div> : <p className="rounded-lg bg-stone-50 px-3 py-5 text-center text-sm text-[#8a9292]">Карт пока нет</p>}
                </section>
              );
            })}
          </div>
        </section>
        <ActionHistory actions={actions}/>
      </main>
    </>
  );
}
```

---

## `src/app/dashboard/CreateCharacterForm.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const allowed: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export default function CreateCharacterForm() {
  const [name, setName] = useState("");
  const [maxHp, setMaxHp] = useState(20);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || name.trim().length > 100) { setMessage("Имя должно содержать от 1 до 100 символов"); return; }
    if (!Number.isInteger(maxHp) || maxHp < 1 || maxHp > 100000) { setMessage("HP должно быть от 1 до 100000"); return; }
    if (!image || !allowed[image.type]) { setMessage("Выберите JPEG, PNG или WebP"); return; }
    if (image.size > 3 * 1024 * 1024) { setMessage("Изображение больше 3 МБ"); return; }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    let uploadedPath: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Нужно войти в аккаунт");

      const path = `${user.id}/${crypto.randomUUID()}.${allowed[image.type]}`;
      const { error: uploadError } = await supabase.storage
        .from("character-images")
        .upload(path, image, { contentType: image.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      const { data: urlData } = supabase.storage.from("character-images").getPublicUrl(path);

      const { error } = await supabase.from("characters").insert({
        user_id: user.id,
        name: name.trim(),
        max_hp: maxHp,
        current_hp: maxHp,
        armor: 0,
        image_url: urlData.publicUrl,
        image_path: path,
        status: "pending",
      });
      if (error) throw error;
      setMessage("Заявка отправлена! Администратор увидит её в очереди модерации.");
      setName("");
      setMaxHp(20);
      setImage(null);
      if (imageInput.current) imageInput.current.value = "";
      router.refresh();
    } catch (error: unknown) {
      // Если запись в базе не создалась, не оставляем бесхозную картинку.
      if (uploadedPath) await supabase.storage.from("character-images").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : "Ошибка отправки заявки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="field-label">Имя персонажа
        <input className="control mt-1.5" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="Имя героя" />
      </label>
      <label className="field-label">Максимальное здоровье
        <input className="control mt-1.5" type="number" min={1} max={100000} step={1} value={maxHp} onChange={(e) => setMaxHp(Number(e.target.value))} required />
      </label>
      <label className="field-label">Изображение персонажа
        <input ref={imageInput} className="control mt-1.5 cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-[#ece4d4] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#35454a]" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <span className="mt-1.5 block text-xs font-normal text-[#7a8587]">JPEG, PNG или WebP, не более 3 МБ.</span>
      </label>
      {message && <p role="status" className="rounded-xl border border-stone-200 bg-[#f8f6ef] p-3 text-sm text-[#4d5e65]">{message}</p>}
      <button disabled={loading} className="action-button-primary w-full">
        {loading ? "Отправка..." : "Отправить на модерацию"}
      </button>
    </form>
  );
}
```

---

## `src/app/dashboard/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { CirclePlus, ScrollText } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import CharacterSummary from "@/components/CharacterSummary";
import { createClient } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";
import CreateCharacterForm from "./CreateCharacterForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("characters").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const characters = (data || []) as Character[];

  return (
    <>
      <SiteHeader /><RealtimeRefresh />
      <main className="page-shell space-y-7">
        <header>
          <p className="eyebrow">Личный раздел</p>
          <h1 className="page-title mt-1">Мои персонажи</h1>
          <p className="subtle mt-2">Здесь хранятся ваши заявки и одобренные герои.</p>
        </header>
        <div className="grid items-start gap-7 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="surface p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2"><CirclePlus aria-hidden="true" size={21} className="text-[#a58151]"/><h2 className="section-title">Новая заявка</h2></div>
            <p className="subtle mb-5">Создайте героя. Он появится в общем списке после одобрения администратором.</p>
            <CreateCharacterForm />
          </section>
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">Мои герои</h2><span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-[#5f6768]">{characters.length}</span></div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error.message}</p>}
            {!error && !characters.length && <div className="surface p-8 text-center"><ScrollText size={32} className="mx-auto mb-3 text-[#b8a383]"/><p className="font-semibold">Персонажей пока нет</p><p className="subtle mt-1">Начните с заявки слева.</p></div>}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {characters.map((char) => <div key={char.id} className="space-y-2"><CharacterSummary character={char} href={char.status === "approved" ? `/character/${char.id}` : undefined} />{char.status === "rejected" && <p className="px-2 text-xs text-[#8b4850]">Заявка отклонена. Создайте новую или свяжитесь с администратором.</p>}</div>)}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
```

---

## `src/app/globals.css`

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--foreground);
  --color-popover: var(--card);
  --color-popover-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: #fff;
  --color-secondary: #f0e8d9;
  --color-secondary-foreground: #25323a;
  --color-muted: #f3f0e9;
  --color-muted-foreground: #657077;
  --color-accent: #eadfcb;
  --color-accent-foreground: #29343a;
  --color-destructive: #a84251;
  --color-destructive-foreground: #fff;
  --color-border: #dedbd2;
  --color-input: #c6c8c5;
  --color-ring: #997241;
  --radius-sm: .4rem;
  --radius-md: .65rem;
  --radius-lg: .95rem;
  --radius-xl: 1.25rem;
}
:root {
  --background: #f6f4ee;
  --foreground: #222e35;
  --card: #fffefa;
  --primary: #293940;
  --gold: #b48b52;
  --muted-ink: #647076;
}
@layer base {
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    min-height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.5;
    background-image: radial-gradient(circle at 8% 0%, #eae5d9 0, transparent 34%),
      radial-gradient(circle at 96% 8%, #eee8db 0, transparent 28%);
    background-attachment: fixed;
  }
  h1, h2, h3, h4 { text-wrap: balance; }
  button:not(:disabled) { cursor: pointer; }
  :focus-visible { outline: 3px solid #b48b52; outline-offset: 3px; }
  ::selection { background: #d5b98b; color: #1a262d; }
}
@layer components {
  .page-shell { width:100%; max-width:72rem; margin-inline:auto; padding:2rem 1rem; }
  .page-title { font-family: Georgia,'Times New Roman',serif; font-size:1.875rem; line-height:1.2; font-weight:700; letter-spacing:-.025em; }
  .section-title { font-family: Georgia,'Times New Roman',serif; font-size:1.35rem; line-height:1.3; font-weight:700; }
  .subtle { font-size:.875rem; line-height:1.7; color:var(--muted-ink); }
  .eyebrow { font-size:.73rem; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:#987549; }
  .surface { border:1px solid #e4e0d7; border-radius:1.1rem; background:var(--card); box-shadow:0 12px 36px -32px rgba(24,35,39,.65); }
  .surface-soft { border:1px solid #e9e2d5; border-radius:.85rem; background:#faf8f1; }
  .control { display:block; width:100%; border:1px solid #cfd0c9; border-radius:.75rem; padding:.75rem .875rem; background:white; color:#253139; font-size:.875rem; outline:none; transition:border-color .2s, box-shadow .2s; }
  .control:focus { border-color:#a98753; box-shadow:0 0 0 3px #b48b5229; }
  .control::placeholder { color:#849096; }
  .field-label { display:block; font-size:.875rem; font-weight:600; color:#354148; }
  .action-button-primary,.action-button-quiet,.action-button-danger,.action-button-success {
    display:inline-flex; min-height:2.5rem; align-items:center; justify-content:center; gap:.5rem;
    padding:.625rem 1rem; border-radius:.75rem; font-size:.875rem; font-weight:700;
    transition:background-color .2s,border-color .2s;
  }
  .action-button-primary:disabled,.action-button-quiet:disabled,.action-button-danger:disabled,.action-button-success:disabled {cursor:not-allowed;opacity:.5;}
  .action-button-primary {background:#283b44;color:#fff;}
  .action-button-primary:hover:not(:disabled) {background:#182b32;}
  .action-button-quiet {border:1px solid #d7d6ce;background:#fffefa;color:#314047;}
  .action-button-quiet:hover:not(:disabled) {background:#f3efe7;}
  .action-button-danger {background:#a43f50;color:#fff;}
  .action-button-danger:hover:not(:disabled) {background:#8d3142;}
  .action-button-success {background:#346c5d;color:#fff;}
  .action-button-success:hover:not(:disabled) {background:#275747;}
  .status-chip {display:inline-flex;align-items:center;gap:.375rem;padding:.25rem .625rem;border:1px solid;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.25;}
  .status-chip-approved {background:#e5f2e8;border-color:#bcd8c3;color:#256142;}
  .status-chip-pending {background:#fff2d7;border-color:#f0d59f;color:#825b20;}
  .status-chip-rejected {background:#fae7e7;border-color:#eec5ca;color:#944050;}
  .status-chip-archived {background:#ebedf0;border-color:#d5d9dc;color:#56616a;}
  .text-link {display:inline-flex;align-items:center;gap:.375rem;color:#704c31;font-size:.875rem;font-weight:700;text-underline-offset:4px;}
  .text-link:hover {text-decoration:underline;}
  .hp-track {height:.625rem;width:100%;overflow:hidden;border-radius:999px;background:#e2e7dc;}
  .hp-fill {height:100%;border-radius:999px;background:linear-gradient(90deg,#4b886e,#73a88b);transition:width .5s;}
}
@media (min-width:640px) {
  .page-shell {padding:2.5rem 1.5rem;}
  .page-title {font-size:2.25rem;}
  .section-title {font-size:1.5rem;}
}
```

---

## `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPG Tracker — хроники героев",
  description: "Персонажи, здоровье, броня, карты и история действий ролевой кампании",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

---

## `src/app/login/page.tsx`

```tsx
"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpenText, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else {
        if (!username.trim()) throw new Error("Укажите имя пользователя");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) throw error;
        if (data.session) { router.replace("/dashboard"); router.refresh(); }
        else { setMessage("Проверьте почту и подтвердите адрес. Затем войдите в аккаунт."); setMode("login"); }
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось выполнить операцию");
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-7">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><span className="grid h-16 w-16 place-items-center rounded-2xl border border-[#b7a078]/40 bg-[#263740] text-[#e2c596] shadow-lg"><BookOpenText size={30} aria-hidden="true" /></span></div>
        <section className="surface p-6 sm:p-8">
          <Link href="/" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> К персонажам</Link>
          <p className="eyebrow mt-7">Добро пожаловать</p>
          <h1 className="page-title mt-1">{mode === "login" ? "Вход в хроники" : "Новый игрок"}</h1>
          <p className="subtle mt-2">{mode === "login" ? "Войдите, чтобы управлять своими заявками." : "Создайте аккаунт, чтобы добавить персонажа."}</p>
          {params.get("message") === "confirm-error" && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Не удалось подтвердить адрес. Проверьте ссылку или попробуйте ещё раз.</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && <label className="field-label">Никнейм
              <input className="control mt-1.5" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} autoComplete="nickname" required placeholder="Как к вам обращаться" />
            </label>}
            <label className="field-label">Email
              <input className="control mt-1.5" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
            </label>
            <label className="field-label">Пароль
              <input className="control mt-1.5" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Не менее 6 символов" />
            </label>
            {message && <p role="status" className="rounded-xl border border-stone-200 bg-[#f8f6ef] p-3 text-sm text-[#526067]">{message}</p>}
            <button disabled={loading} className="action-button-primary w-full"><LockKeyhole aria-hidden="true" size={16} /> {loading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}</button>
          </form>
          <div className="mt-5 border-t border-stone-200 pt-5 text-center">
            <button type="button" className="text-link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
              {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="page-shell">Загрузка формы...</div>}><LoginForm /></Suspense>;
}
```

---

## `src/app/page.tsx`

```tsx
import { ScrollText, Sparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import CharacterDirectory from "@/components/CharacterDirectory";
import { createClient } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("characters").select("*").eq("status", "approved").order("created_at", { ascending: false });
  const characters = (data || []) as Character[];

  return (
    <>
      <SiteHeader />
      <RealtimeRefresh />
      <main className="page-shell">
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-[#263740] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-[#a78a60]/20" />
          <div className="pointer-events-none absolute -right-1 top-1 h-44 w-44 rounded-full border border-[#a78a60]/20" />
          <div className="relative z-10 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-[#d4b78a]"><Sparkles size={14} aria-hidden="true"/> Все герои в одном месте</p>
            <h1 className="page-title text-white">Персонажи кампании</h1>
            <p className="mt-3 max-w-xl leading-relaxed text-[#d6dddc]">Следите за здоровьем, бронёй и картами героев. Изменения отображаются для всех участников игры.</p>
          </div>
          <ScrollText aria-hidden="true" className="pointer-events-none absolute bottom-[-28px] right-8 hidden rotate-[-14deg] text-[#c4a36e]/15 sm:block" size={160} strokeWidth={1} />
        </div>
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Ошибка загрузки: {error.message}</p>}
        {!error && characters.length === 0 ? (
          <div className="surface px-6 py-12 text-center"><ScrollText className="mx-auto mb-4 text-[#a58a61]" size={36} aria-hidden="true"/><h2 className="section-title">Книга героев пока пуста</h2><p className="subtle mt-2">После одобрения заявок персонажи появятся здесь.</p></div>
        ) : !error && <CharacterDirectory characters={characters} />}
      </main>
    </>
  );
}
```

---

## `src/components/ActionHistory.tsx`

```tsx
import { Archive, CheckCheck, Clock3, HeartPlus, Shield, Sword, X } from "lucide-react";
import { actionLabel, type CharacterAction } from "@/lib/types";

const themes: Record<string, { panel: string; icon: typeof Sword }> = {
  damage: { panel: "border-rose-200 bg-rose-50 text-rose-700", icon: Sword },
  heal: { panel: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: HeartPlus },
  set_armor: { panel: "border-blue-200 bg-blue-50 text-blue-700", icon: Shield },
  status_approved: { panel: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCheck },
  status_rejected: { panel: "border-rose-200 bg-rose-50 text-rose-700", icon: X },
  status_archived: { panel: "border-slate-200 bg-slate-50 text-slate-700", icon: Archive },
};

export default function ActionHistory({ actions }: { actions: CharacterAction[] }) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow">Журнал кампании</p>
          <h2 className="section-title mt-1">История действий</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600">Последние {actions.length} записей</span>
      </div>
      {actions.length === 0 ? (
        <p className="p-7 text-sm text-[#697377]">Действий пока не было.</p>
      ) : (
        <ol className="divide-y divide-stone-200/80">
          {actions.map((action) => {
            const theme = themes[action.action_type] ?? { panel: "border-stone-200 bg-stone-50 text-stone-700", icon: Clock3 };
            const Icon = theme.icon;
            const hasAmount = action.action_type === "damage" || action.action_type === "heal" || action.action_type === "set_armor";
            return (
              <li key={action.id} className="flex min-w-0 items-start gap-3 p-4 sm:gap-4 sm:px-7 sm:py-5">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${theme.panel}`}><Icon aria-hidden="true" size={19}/></div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                    <strong className="min-w-0 text-sm font-bold leading-6 text-[#24333b] sm:text-base">
                      {actionLabel(action.action_type)}{hasAmount && <span className="ml-1 font-extrabold tabular-nums">· {action.amount}</span>}
                    </strong>
                    <time dateTime={action.created_at} className="inline-flex shrink-0 items-center gap-1.5 text-xs leading-5 text-[#667278] sm:pt-0.5">
                      <Clock3 size={13} aria-hidden="true"/>
                      {new Date(action.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-[#526067]">
                      <HeartPlus size={13} aria-hidden="true"/> HP <b className="tabular-nums text-[#24333b]">{action.hp_before} → {action.hp_after}</b>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-[#526067]">
                      <Shield size={13} aria-hidden="true"/> Броня <b className="tabular-nums text-[#24333b]">{action.armor_before} → {action.armor_after}</b>
                    </span>
                    {action.blocked_amount > 0 && <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">Поглощено: {action.blocked_amount}</span>}
                  </div>
                  {action.note && <p className="whitespace-pre-wrap break-words border-l-2 border-[#c9b28e] pl-3 text-sm leading-relaxed text-[#5c666b]">{action.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
```

---

## `src/components/CharacterDirectory.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import type { Character } from "@/lib/types";
import CharacterSummary from "@/components/CharacterSummary";

export default function CharacterDirectory({ characters }: { characters: Character[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "name" | "hp">("new");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ru-RU");
    const result = characters.filter((char) => char.name.toLocaleLowerCase("ru-RU").includes(term));
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "ru-RU"));
    if (sort === "hp") result.sort((a, b) => b.current_hp - a.current_hp);
    return result;
  }, [characters, search, sort]);

  return (
    <section aria-label="Каталог персонажей">
      <div className="surface mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block min-w-0 flex-1 sm:max-w-lg">
          <span className="sr-only">Поиск персонажа по имени</span>
          <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8588]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="control pl-10" placeholder="Найти персонажа по имени..." />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-[#556166]">
          <span className="shrink-0">Сортировка</span>
          <select className="control max-w-44" value={sort} onChange={(event) => setSort(event.target.value as "new" | "name" | "hp")}>
            <option value="new">Сначала новые</option>
            <option value="name">По имени</option>
            <option value="hp">По здоровью</option>
          </select>
        </label>
      </div>
      <p className="mb-4 flex items-center gap-2 text-sm text-[#69747a]"><UsersRound size={16} aria-hidden="true" /> Найдено персонажей: <b className="tabular-nums text-[#27383d]">{filtered.length}</b></p>
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((char) => <CharacterSummary key={char.id} character={char} href={`/character/${char.id}`} />)}
        </div>
      ) : (
        <div className="surface p-10 text-center">
          <Search size={30} aria-hidden="true" className="mx-auto mb-3 text-[#a3a9a9]" />
          <p className="font-semibold">Ничего не найдено</p>
          <p className="subtle mt-1">Попробуйте другое имя персонажа.</p>
        </div>
      )}
    </section>
  );
}
```

---

## `src/components/CharacterPortrait.tsx`

```tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, ImageOff, X } from "lucide-react";

type Size = "small" | "medium" | "large";
const sizes: Record<Size, string> = {
  small: "h-[72px] w-[72px] shrink-0",
  medium: "h-24 w-24 shrink-0 sm:h-28 sm:w-28",
  large: "h-60 w-full sm:h-72",
};

export default function CharacterPortrait({
  src,
  alt,
  size = "small",
  className = "",
}: {
  src: string | null;
  alt: string;
  size?: Size;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        // Внутри окна только один элемент управления — кнопка закрытия.
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  const imageClass = `${sizes[size]} overflow-hidden rounded-xl border border-stone-200 bg-stone-100 ${className}`;
  if (!src) {
    return (
      <div className={`${imageClass} flex items-center justify-center text-stone-400`} role="img" aria-label={`Без изображения: ${alt}`}>
        <ImageOff aria-hidden="true" size={size === "small" ? 23 : 34} />
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`${imageClass} group relative cursor-zoom-in focus-visible:outline-amber-600`}
        aria-label={`Увеличить изображение: ${alt}`}
        title="Нажмите, чтобы увеличить изображение"
      >
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-lg bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Expand aria-hidden="true" size={14} />
        </span>
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c141b]/90 p-4 backdrop-blur-sm sm:p-10"
        >
          <div role="dialog" aria-modal="true" aria-label={`Изображение персонажа: ${alt}`} className="relative flex max-h-full max-w-full flex-col items-center gap-3">
            <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="absolute -top-2 -right-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-slate-950/85 text-white shadow-xl transition hover:bg-slate-800 sm:-top-4 sm:-right-4" aria-label="Закрыть изображение">
              <X aria-hidden="true" size={21} />
            </button>
            <img src={src} alt={alt} className="max-h-[83vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
            <p className="max-w-[85vw] truncate text-center text-sm font-medium text-white/85">{alt}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
```

---

## `src/components/CharacterStatus.tsx`

```tsx
import { Check, Clock3, Archive, X } from "lucide-react";
import { statusLabel, type CharacterStatus } from "@/lib/types";

const names: Record<CharacterStatus, string> = {
  approved: "status-chip-approved",
  pending: "status-chip-pending",
  rejected: "status-chip-rejected",
  archived: "status-chip-archived",
};
const icons = { approved: Check, pending: Clock3, rejected: X, archived: Archive };

export default function CharacterStatus({ status }: { status: CharacterStatus }) {
  const Icon = icons[status];
  return <span className={`status-chip ${names[status]}`}><Icon aria-hidden="true" size={13}/>{statusLabel(status)}</span>;
}
```

---

## `src/components/CharacterSummary.tsx`

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Character } from "@/lib/types";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import CharacterVitals from "@/components/CharacterVitals";

export default function CharacterSummary({ character, href }: { character: Character; href?: string }) {
  return (
    <article className="surface flex min-w-0 flex-col gap-4 p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <CharacterPortrait src={character.image_url} alt={character.name} size="medium" />
        <div className="min-w-0 flex-1 space-y-2">
          <CharacterStatus status={character.status} />
          {href ? (
            <Link href={href} className="group flex w-fit items-center gap-1.5 text-lg font-bold leading-tight text-[#263840] hover:text-[#8a623b]" style={{ fontFamily: "Georgia, serif" }}>
              <span className="break-words">{character.name}</span>
              <ArrowUpRight aria-hidden="true" size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <h3 className="break-words text-lg font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>{character.name}</h3>
          )}
          <p className="text-xs text-[#7b8589]">Персонаж кампании</p>
        </div>
      </div>
      <div className="border-t border-[#eee9df] pt-4">
        <CharacterVitals character={character} compact />
      </div>
      {href && <Link href={href} className="text-link self-start">Открыть профиль <ArrowUpRight size={15} aria-hidden="true" /></Link>}
    </article>
  );
}
```

---

## `src/components/CharacterVitals.tsx`

```tsx
import { HeartPulse, Shield } from "lucide-react";
import type { Character } from "@/lib/types";

export default function CharacterVitals({ character, compact = false }: { character: Pick<Character, "current_hp" | "max_hp" | "armor">; compact?: boolean }) {
  const percent = character.max_hp > 0 ? Math.max(0, Math.min(100, character.current_hp / character.max_hp * 100)) : 0;
  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#466c58]"><HeartPulse size={16} aria-hidden="true"/> Здоровье</span>
        <strong className="tabular-nums text-[#27383e]">{character.current_hp} / {character.max_hp} HP</strong>
      </div>
      <div className="hp-track" role="progressbar" aria-label="Здоровье" aria-valuemin={0} aria-valuemax={character.max_hp} aria-valuenow={character.current_hp}>
        <div className="hp-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#5a7294]"><Shield size={16} aria-hidden="true"/> Броня</span>
        <strong className="tabular-nums text-[#27383e]">{character.armor}</strong>
      </div>
    </div>
  );
}
```

---

## `src/components/SiteHeader.tsx`

```tsx
import Link from "next/link";
import { BookOpenText, Crown, LogIn, LogOut, Shield, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isAdmin } = user ? await supabase.rpc("is_admin") : { data: false };

  return (
    <header className="relative z-20 border-b border-[#314249] bg-[#1e2d34] text-[#f8f5ed] shadow-md">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight" aria-label="RPG Tracker — на главную">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#ab8855]/50 bg-[#324047] text-[#dec49c]"><BookOpenText size={21} aria-hidden="true" /></span>
          <span className="text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>RPG <span className="text-[#d6b37e]">Tracker</span><small className="block font-sans text-[10px] font-normal uppercase tracking-[.16em] text-[#b3bec0]">Хроники кампании</small></span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-[#e6e9e6] transition hover:bg-white/10"><UsersRound size={16} aria-hidden="true"/> <span className="hidden sm:inline">Все персонажи</span><span className="sm:hidden">Герои</span></Link>
          {user && <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-[#e6e9e6] transition hover:bg-white/10"><Shield size={16} aria-hidden="true"/> Мои</Link>}
          {isAdmin && <Link href="/admin" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#977c55]/40 bg-[#37413f] px-3 py-2 font-semibold text-[#f0cc95] transition hover:bg-[#414c48]"><Crown size={16} aria-hidden="true"/> Админка</Link>}
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-[#e6e9e6] transition hover:bg-white/10"><LogOut size={16} aria-hidden="true"/> Выйти</button>
            </form>
          ) : (
            <Link href="/login" className="ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#d1ab75] px-4 py-2 font-bold text-[#1d2b31] transition hover:bg-[#e1bd89]"><LogIn size={16} aria-hidden="true"/> Войти</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
```
