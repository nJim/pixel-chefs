// Pure game rules shared by the server (scoring) and client (rendering).

export const COUNTDOWN_MS = 3500;
export const MAX_POINTS = 1000;
export const MIN_POINTS = 100;
export const FIRST_BLOOD_BONUS = 250;

const ROUND_PRESETS = [5, 10, 15];

/** Round-count choices for the lobby: the presets that fit, plus "everyone". */
export function roundOptions(teamSize: number): number[] {
  return [...ROUND_PRESETS.filter((n) => n < teamSize), teamSize];
}
export const SECONDS_OPTIONS = [10, 15, 20, 30];

/** Points for a correct answer given how long the player took. */
export function pointsFor(elapsedMs: number, roundMs: number): number {
  const fraction = Math.min(Math.max(elapsedMs / roundMs, 0), 1);
  return Math.max(MIN_POINTS, Math.round(MAX_POINTS * (1 - fraction)));
}

/**
 * Pixel grid sizes the photo steps through. 0 means the full-resolution photo.
 * Stepped snaps (not a smooth blur) keep the 8-bit feel.
 */
export const PIXEL_STAGES = [4, 6, 8, 11, 15, 20, 28, 40, 56, 0];

/** Which stage to show; the photo is fully sharp at 85% of the round. */
export function stageIndexAt(elapsedMs: number, roundMs: number): number {
  if (elapsedMs <= 0) return 0;
  const progress = elapsedMs / (roundMs * 0.85);
  return Math.min(PIXEL_STAGES.length - 1, Math.floor(progress * (PIXEL_STAGES.length - 1)));
}

export const PLAYER_COLORS = [
  "#0EB747", // k-kelly
  "#DFEB8E", // lemon lime
  "#E17C6F", // rhubarb
  "#E7BFBE", // pink salt
  "#987598", // plum 200
  "#4AC975", // kelly 200
  "#CBD96D", // lemon lime 400
  "#E89E93", // rhubarb 200
  "#F8F5EC", // whipped cream
  "#CAA2A1", // pink salt 400
];

export const CODE_LETTERS = "BCDFGHJKLMNPQRSTVWXZ";

export function cleanNickname(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 16);
}

export function cleanCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}
