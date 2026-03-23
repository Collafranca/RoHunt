export type PublicReferencesQuery = {
  readonly limit: number;
  readonly cursor: number;
  readonly source?: string;
};

export type PublicReference = {
  readonly id: string;
  readonly source: string;
  readonly value: string;
};

export type PublicReferencesResult = {
  readonly data: PublicReference[];
  readonly total: number;
  readonly nextCursor: number | null;
};

const PUBLIC_REFERENCES: readonly PublicReference[] = [
  {
    id: "ref_1",
    source: "discord",
    value: "discord.gg/rohunt",
  },
  {
    id: "ref_2",
    source: "discord",
    value: "discord.gg/robloxdev",
  },
  {
    id: "ref_3",
    source: "forum",
    value: "devforum.roblox.com",
  },
];

export function listPublicReferences(query: PublicReferencesQuery): PublicReferencesResult {
  const filtered = query.source
    ? PUBLIC_REFERENCES.filter((reference) => reference.source === query.source)
    : PUBLIC_REFERENCES;

  const page = filtered.slice(query.cursor, query.cursor + query.limit);
  const nextCursor = query.cursor + query.limit < filtered.length ? query.cursor + query.limit : null;

  return {
    data: [...page],
    total: filtered.length,
    nextCursor,
  };
}
