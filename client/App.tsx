import { useQuery } from "@spacefast/zero/client";
import { useEffect, useRef, useState } from "preact/hooks";

import { cleanCode } from "../shared/scoring";
import { syncClock } from "./clock";
import { Home, Logo } from "./Home";
import { Lobby } from "./Lobby";
import { Podium } from "./Podium";
import { Reveal } from "./Reveal";
import { Round } from "./Round";
import { isMuted, setMuted } from "./sound";
import { injectStyles } from "./styles";
import type { Game } from "./ui";

injectStyles();
void syncClock();

// One seat per tab: sessionStorage survives reloads but not new tabs, which
// also makes it easy to test several players from one browser.
function tabPlayerKey(): string {
  const fresh = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
  try {
    let key = sessionStorage.getItem("pc:key");
    if (!key) {
      key = fresh();
      sessionStorage.setItem("pc:key", key);
    }
    return key;
  } catch {
    return fresh();
  }
}

// Only "#/ABCD" is a room link; other hashes (like the dev server's capability token) are ignored.
const codeFromHash = () => cleanCode(/^#\/([A-Za-z]{4})$/.exec(location.hash)?.[1] ?? "");

function useHashCode(): [string, (code: string) => void] {
  const [code, setCode] = useState(codeFromHash);
  useEffect(() => {
    const onChange = () => setCode(codeFromHash());
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return [code, (next) => (location.hash = next ? `/${next}` : "")];
}

function MuteButton() {
  const [muted, setState] = useState(isMuted);
  return (
    <button
      class="pc-btn pc-btn--ghost pc-btn--sm"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      onClick={() => {
        setMuted(!muted);
        setState(!muted);
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

function GameScreen({ code, playerKey, onLeave }: { code: string; playerKey: string; onLeave: () => void }) {
  const live = useQuery<Game | null>("game", code, playerKey);

  // The live query can briefly report "loading" again while it refetches or
  // reconnects; keep showing the last state for this room instead of blanking mid-round.
  const last = useRef<{ code: string; game: Game | null } | null>(null);
  if (live !== undefined) last.current = { code, game: live };
  const game = live !== undefined ? live : last.current?.code === code ? last.current.game : undefined;

  // Each new screen starts at the top, so the photo and timer are always in view.
  const screen = game ? `${game.room.status}:${game.round?.id ?? ""}` : "";
  useEffect(() => scrollTo(0, 0), [screen]);

  if (game === undefined) {
    return <p class="pixel pc-blink text-center text-xs">LOADING…</p>;
  }
  if (game === null) {
    return (
      <div class="flex flex-col items-center gap-4 text-center">
        <p class="pixel text-xs">No game with code {code}.</p>
        <button class="pc-btn" onClick={onLeave}>
          BACK HOME
        </button>
      </div>
    );
  }
  if (!game.meId) {
    return <Home playerKey={playerKey} lockedCode={code} onEnter={() => undefined} />;
  }

  const props = { game, playerKey };
  switch (game.room.status) {
    case "lobby":
      return <Lobby {...props} />;
    case "playing":
      return game.round ? <Round key={game.round.id} {...props} /> : null;
    case "reveal":
      return game.round ? <Reveal key={game.round.id} {...props} /> : null;
    case "done":
      return <Podium {...props} />;
  }
}

export default function App() {
  const [playerKey] = useState(tabPlayerKey);
  const [code, setCode] = useHashCode();

  return (
    <main class="mx-auto box-border flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-5">
      <header class="flex items-center justify-between gap-3">
        {code ? (
          <button class="pc-btn pc-btn--ghost pc-btn--sm" onClick={() => setCode("")} aria-label="Leave game">
            ◀ EXIT
          </button>
        ) : (
          <span />
        )}
        {code && <Logo small />}
        <MuteButton />
      </header>
      {code ? <GameScreen code={code} playerKey={playerKey} onLeave={() => setCode("")} /> : <Home playerKey={playerKey} onEnter={setCode} />}
      <footer class="mt-auto pt-6 text-center text-xs opacity-50">Made by and for the Web Chefs at Four Kitchens</footer>
    </main>
  );
}
