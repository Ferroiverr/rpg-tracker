/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, ImageOff, X } from "lucide-react";

type Size = "small" | "medium" | "large";
const sizes: Record<Size, string> = {
  small: "h-12 w-12 shrink-0 rounded-[.65rem]",
  medium: "h-16 w-16 shrink-0 rounded-xl",
  large: "aspect-[4/5] w-full max-w-[260px] rounded-2xl",
};

export default function CharacterPortrait({ src, alt, size = "small", className = "" }: {
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

  const base = `${sizes[size]} relative overflow-hidden border border-[#394657] bg-[#202b39] ${className}`;
  if (!src) {
    return <div className={`${base} flex items-center justify-center text-[#8493a4]`} role="img" aria-label={`Без изображения: ${alt}`}>
      <ImageOff aria-hidden="true" size={size === "large" ? 42 : 22} />
    </div>;
  }
  return <>
    <button type="button" ref={triggerRef} onClick={() => setOpen(true)} className={`${base} group cursor-zoom-in`} aria-label={`Увеличить изображение персонажа: ${alt}`} title="Нажмите для просмотра в полном размере">
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110" />
      <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-md bg-[#071018]/85 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Expand size={13} aria-hidden="true" /></span>
    </button>
    {open && typeof document !== "undefined" && createPortal(
      <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05080e]/95 p-5 backdrop-blur-md sm:p-10">
        <div role="dialog" aria-modal="true" aria-label={`Изображение персонажа: ${alt}`} className="relative flex max-h-full max-w-full flex-col items-center gap-4">
          <button type="button" ref={closeButtonRef} onClick={() => setOpen(false)} className="absolute -right-3 -top-3 z-10 grid h-12 w-12 place-items-center rounded-full border border-[#667489] bg-[#182635] text-white shadow-2xl transition hover:bg-[#304256] sm:-right-6 sm:-top-5" aria-label="Закрыть изображение"><X size={22} aria-hidden="true" /></button>
          <img src={src} alt={alt} className="max-h-[82vh] max-w-[92vw] rounded-xl border border-[#344254] object-contain shadow-2xl" />
          <p className="max-w-[85vw] truncate text-center text-sm font-medium text-[#dbe4ec]">{alt}</p>
        </div>
      </div>, document.body
    )}
  </>;
}
