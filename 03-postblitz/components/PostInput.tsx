"use client";

type Props = {
  thema: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function PostInput({
  thema,
  onChange,
  onSubmit,
  loading,
}: Props) {
  return (
    <section>
      <h2>Heute</h2>
      <label>
        Worum geht es heute?
        <textarea
          value={thema}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Stichworte, Anlass, Idee …"
        />
      </label>
      <button onClick={onSubmit} disabled={loading || !thema.trim()}>
        {loading ? "Generiere …" : "3 Varianten generieren"}
      </button>
    </section>
  );
}
