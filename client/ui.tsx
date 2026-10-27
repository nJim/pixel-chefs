import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";

import { CHEFS_BY_ID } from "../shared/team";

export type Player = { id: string; nickname: string; color: string; score: number };

export type Game = {
  room: {
    code: string;
    status: "lobby" | "playing" | "reveal" | "done";
    roundIndex: number;
    totalRounds: number;
    roundMs: number;
    isHost: boolean;
    hostId: string | null;
  };
  players: Player[];
  meId: string | null;
  round: null | {
    id: string;
    index: number;
    chefId: string;
    options: string[];
    startsAt: number;
    endsAt: number;
    ended: boolean;
    answeredIds: string[];
    myAnswer: null | { choice: string; correct: boolean; points: number };
    results: null | { playerId: string; choice: string; correct: boolean; points: number; elapsedMs: number; firstBlood: boolean }[];
  };
  awards: null | {
    eagleEye: null | { playerId: string; elapsedMs: number };
    needsGlasses: null | { playerId: string; wrong: number };
  };
};

/** Game state plus the per-tab key every mutation needs. */
export type ScreenProps = { game: Game; playerKey: string };

export const chefName = (id: string) => CHEFS_BY_ID[id]?.name ?? "???";

export function Avatar({ player, size = 40, badge }: { player: Pick<Player, "nickname" | "color">; size?: number; badge?: ComponentChildren }) {
  const initials = player.nickname
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span class="pc-avatar" style={{ width: `${size}px`, height: `${size}px`, background: player.color, fontSize: `${Math.round(size / 3.4)}px` }}>
      {initials}
      {badge && <span class="absolute -right-2 -top-2 text-base leading-none">{badge}</span>}
    </span>
  );
}

export function Panel({ children, class: className = "" }: { children: ComponentChildren; class?: string }) {
  return <section class={`pc-panel p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" class="pixel pc-pop mt-3 text-[10px] text-[#E17C6F]">
      ✖ {message}
    </p>
  );
}

/** Wraps an async action with a busy flag and a friendly error message. */
export function useAction<TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(...args: TArgs) {
    setBusy(true);
    setError(null);
    try {
      await fn(...args);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error };
}

export function WaitingForHost({ game, label }: { game: Game; label: string }) {
  const host = game.players.find((p) => p.id === game.room.hostId);
  return (
    <p class="pixel text-center text-[10px] text-[#DFEB8E]">
      {label} {host ? host.nickname : "the host"}
      <span class="pc-blink">…</span>
    </p>
  );
}

export function Scoreboard({ game, deltas }: { game: Game; deltas?: Map<string, number> }) {
  return (
    <ol class="flex flex-col gap-2">
      {game.players.map((player, rank) => (
        <li
          key={player.id}
          class={`pc-pop flex items-center gap-3 px-2 py-1 ${player.id === game.meId ? "bg-[#0F2C15]" : ""}`}
          style={{ animationDelay: `${rank * 60}ms` }}
        >
          <span class="pixel w-8 text-[10px] text-[#DFEB8E]">{rank + 1}.</span>
          <Avatar player={player} size={32} />
          <span class="min-w-0 flex-1 truncate font-bold">
            {player.nickname}
            {player.id === game.meId && <span class="ml-2 text-xs font-normal opacity-70">(you)</span>}
          </span>
          {deltas?.get(player.id) ? <span class="pixel text-[10px] text-[#4AC975]">+{deltas.get(player.id)}</span> : null}
          <span class="pixel w-16 text-right text-xs">{player.score}</span>
        </li>
      ))}
    </ol>
  );
}
