"use client";

import { useState } from "react";

type Props = {
  varianten: string[];
};

export default function PostOutput({ varianten }: Props) {
  const [kopiert, setKopiert] = useState<number | null>(null);

  if (varianten.length === 0) return null;

  async function copy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setKopiert(index);
    setTimeout(() => setKopiert(null), 1500);
  }

  return (
    <section>
      <h2>Varianten</h2>
      {varianten.map((text, i) => (
        <article key={i} className="variant">
          <header>
            <span>Variante {i + 1}</span>
            <button onClick={() => copy(text, i)}>
              {kopiert === i ? "Kopiert" : "Kopieren"}
            </button>
          </header>
          {text}
        </article>
      ))}
    </section>
  );
}
