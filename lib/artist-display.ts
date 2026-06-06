export type ArtistNameFields = {
  stageName: string;
  firstName: string;
  lastName: string;
};

export function artistLabel(artist: ArtistNameFields) {
  if (artist.stageName.trim()) return artist.stageName.trim();
  return `${artist.firstName} ${artist.lastName}`.trim();
}

export function artistDisplayName(artist: ArtistNameFields) {
  const legal = `${artist.firstName} ${artist.lastName}`.trim();
  const stage = artist.stageName.trim();
  if (stage && stage.toLowerCase() !== legal.toLowerCase()) {
    return `${stage} (${legal})`;
  }
  return legal;
}
