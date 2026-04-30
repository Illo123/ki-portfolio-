"use client";

import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import PostInput from "@/components/PostInput";
import PostOutput from "@/components/PostOutput";
import type { Profile } from "@/lib/prompt";

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [thema, setThema] = useState("");
  const [varianten, setVarianten] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setVarianten([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, thema }),
      });
      const data = (await res.json()) as {
        varianten?: string[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setVarianten(data.varianten ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>PostBlitz</h1>
      <ProfileForm onChange={setProfile} />
      <PostInput
        thema={thema}
        onChange={setThema}
        onSubmit={generate}
        loading={loading}
      />
      {error && <section style={{ color: "#b00" }}>Fehler: {error}</section>}
      <PostOutput varianten={varianten} />
    </main>
  );
}
