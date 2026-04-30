export type Profile = {
  name: string;
  rolle: string;
  zielgruppe: string;
  tonalitaet: string;
};

export type GenerateInput = {
  profile: Profile;
  thema: string;
};

export function buildSystemPrompt(profile: Profile): string {
  return `Du schreibst LinkedIn-Posts auf Deutsch für eine reale Person.

Profil:
- Name: ${profile.name}
- Rolle: ${profile.rolle}
- Zielgruppe: ${profile.zielgruppe}
- Tonalität: ${profile.tonalitaet}

Gib genau drei Varianten zurück, getrennt durch eine Zeile mit ---.
Keine Einleitung, keine Nummerierung, keine Hashtags am Ende erklären.
Jede Variante 80-150 Wörter, eigenständig lesbar.`;
}

export function buildUserPrompt(thema: string): string {
  return `Thema/Anlass des heutigen Posts:\n\n${thema}`;
}

export function splitVariants(text: string): string[] {
  return text
    .split(/\n-{3,}\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3);
}
