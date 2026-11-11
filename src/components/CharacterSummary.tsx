import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Character } from "@/lib/types";
import CharacterPortrait from "@/components/CharacterPortrait";
import CharacterStatus from "@/components/CharacterStatus";
import CharacterVitals from "@/components/CharacterVitals";

export default function CharacterSummary({ character, href }: { character: Character; href?: string }) {
  return <article className="surface flex min-w-0 flex-col gap-4 p-4 transition-colors hover:border-[#4c6174] sm:p-5">
    <div className="flex min-w-0 items-center gap-3">
      <CharacterPortrait src={character.image_url} alt={character.name} size="medium" />
      <div className="min-w-0 flex-1 space-y-2">
        <CharacterStatus status={character.status}/>
        {href ? <Link href={href} className="group flex min-w-0 items-start gap-1.5 font-semibold text-[#f5eee4] hover:text-[#e7bd81]">
          <span className="min-w-0 break-words">{character.name}</span><ArrowUpRight size={17} className="mt-1 shrink-0" aria-hidden="true" />
        </Link> : <h3 className="min-w-0 break-words font-semibold text-[#f5eee4]">{character.name}</h3>}
      </div>
    </div>
    <div className="surface-soft p-4"><CharacterVitals character={character} compact/></div>
    {href && <Link href={href} className="text-link self-start">Открыть досье <ArrowUpRight size={17} aria-hidden="true"/></Link>}
  </article>;
}
