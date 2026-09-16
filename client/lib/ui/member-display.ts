const AVATAR_COLORS = ["#ff8a70", "#5b9dff", "#3ecf8e", "#f5b642", "#f2545b"];

export function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

// Deterministic so the same person always gets the same color across
// widgets/pages, without persisting a color choice anywhere.
export function avatarColorForName(name: string): string {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash]!;
}
