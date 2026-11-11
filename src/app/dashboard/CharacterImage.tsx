/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface CharacterImageProps {
  src: string;
  alt: string;
}

export default function CharacterImage({ src, alt }: CharacterImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Миниатюра */}
      <div
        className="w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center cursor-zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-72 w-auto h-auto object-contain"
        />
      </div>

      {/* Полноэкранный просмотр */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}