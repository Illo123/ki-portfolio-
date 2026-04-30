"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/prompt";

const STORAGE_KEY = "postblitz.profile";

const EMPTY: Profile = {
  name: "",
  rolle: "",
  zielgruppe: "",
  tonalitaet: "professionell, aber nahbar",
};

type Props = {
  onChange: (profile: Profile) => void;
};

export default function ProfileForm({ onChange }: Props) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Profile;
      setProfile(parsed);
      onChange(parsed);
    }
    setLoaded(true);
  }, [onChange]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    const next = { ...profile, [key]: value };
    setProfile(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    onChange(next);
  }

  if (!loaded) return null;

  return (
    <section>
      <h2>Profil</h2>
      <label>
        Name
        <input
          value={profile.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </label>
      <label>
        Rolle / Branche
        <input
          value={profile.rolle}
          onChange={(e) => update("rolle", e.target.value)}
        />
      </label>
      <label>
        Zielgruppe
        <input
          value={profile.zielgruppe}
          onChange={(e) => update("zielgruppe", e.target.value)}
        />
      </label>
      <label>
        Tonalität
        <input
          value={profile.tonalitaet}
          onChange={(e) => update("tonalitaet", e.target.value)}
        />
      </label>
    </section>
  );
}
