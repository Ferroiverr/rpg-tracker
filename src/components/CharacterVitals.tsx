import { HeartPulse, Shield } from "lucide-react";
import type { Character } from "@/lib/types";

export default function CharacterVitals({ character, compact = false }: {
  character: Pick<Character, "current_hp" | "max_hp" | "armor">;
  compact?: boolean;
}) {
  const percentage = character.max_hp > 0 ? Math.max(0, Math.min(100, character.current_hp / character.max_hp * 100)) : 0;
  return <div className={compact ? "space-y-2.5" : "space-y-4"}>
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#9fdfbd]"><HeartPulse size={17} aria-hidden="true"/> Здоровье</span>
      <strong className="number text-base text-[#f0f5f5]">{character.current_hp} <span className="font-normal text-[#8295a9]">/</span> {character.max_hp} <span className="text-xs font-medium text-[#a5b4c2]">HP</span></strong>
    </div>
    <div className="hp-track" role="progressbar" aria-label="Здоровье" aria-valuemin={0} aria-valuemax={character.max_hp} aria-valuenow={character.current_hp}>
      <div className="hp-fill" style={{width:`${percentage}%`}}/>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-[#2b3a49] pt-3">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8d8f5]"><Shield size={17} aria-hidden="true"/> Броня</span>
      <strong className="number text-base text-[#f0f5f5]">{character.armor}</strong>
    </div>
  </div>;
}
