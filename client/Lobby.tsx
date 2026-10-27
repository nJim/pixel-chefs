import { useMutation } from "@spacefast/zero/client";
import { useEffect, useRef, useState } from "preact/hooks";

import { SECONDS_OPTIONS, roundOptions } from "../shared/scoring";
import { TEAM } from "../shared/team";
import { sfx } from "./sound";
import { Avatar, ErrorLine, Panel, type ScreenProps, WaitingForHost, useAction } from "./ui";

export function Lobby({ game, playerKey }: ScreenProps) {
  const { room, players } = game;
  const updateSettings = useMutation<[string, string, number, number], void>("updateSettings");
  const startGame = useMutation<[string, string], void>("startGame");
  const [copied, setCopied] = useState(false);

  // Blip whenever someone new arrives.
  const seen = useRef(players.length);
  useEffect(() => {
    if (players.length > seen.current) sfx.join();
    seen.current = players.length;
  }, [players.length]);

  const settings = useAction((rounds: number, seconds: number) => updateSettings(room.code, playerKey, rounds, seconds));
  const start = useAction(() => startGame(room.code, playerKey));

  const inviteUrl = `${location.origin}${location.pathname}#/${room.code}`;
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy this invite link:", inviteUrl);
    }
  }

  const seconds = room.roundMs / 1000;

  return (
    <div class="flex flex-col gap-6">
      <Panel class="text-center">
        <p class="pixel m-0 text-[10px] text-[#DFEB8E]">ROOM CODE</p>
        <p class="pixel pc-logo my-3 text-5xl tracking-[0.25em] sm:text-6xl">{room.code}</p>
        <button class="pc-btn pc-btn--ghost pc-btn--sm" onClick={() => void copyInvite()}>
          {copied ? "✓ COPIED!" : "COPY INVITE LINK"}
        </button>
      </Panel>

      <Panel>
        <h2 class="pixel m-0 mb-4 text-xs text-[#DFEB8E]">
          CHEFS IN THE KITCHEN ({players.length})
        </h2>
        <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((player) => (
            <li key={player.id} class="pc-pop flex min-w-0 items-center gap-2">
              <Avatar player={player} size={36} badge={player.id === room.hostId ? "👑" : undefined} />
              <span class="truncate font-bold">{player.nickname}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {room.isHost ? (
        <Panel class="flex flex-col gap-4">
          <div>
            <p class="pixel m-0 mb-2 text-[10px] text-[#DFEB8E]">ROUNDS</p>
            <div class="flex flex-wrap">
              {roundOptions(TEAM.length).map((n) => (
                <button
                  key={n}
                  class={`pc-btn pc-btn--ghost pc-btn--sm ${room.totalRounds === n ? "is-on" : ""}`}
                  aria-pressed={room.totalRounds === n}
                  onClick={() => void settings.run(n, seconds)}
                >
                  {n === TEAM.length ? `ALL ${n}` : n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p class="pixel m-0 mb-2 text-[10px] text-[#DFEB8E]">SECONDS PER ROUND</p>
            <div class="flex flex-wrap">
              {SECONDS_OPTIONS.map((n) => (
                <button
                  key={n}
                  class={`pc-btn pc-btn--ghost pc-btn--sm ${seconds === n ? "is-on" : ""}`}
                  aria-pressed={seconds === n}
                  onClick={() => void settings.run(room.totalRounds, n)}
                >
                  {n}s
                </button>
              ))}
            </div>
          </div>
          <button class="pc-btn pc-btn--lime mt-2 text-sm" disabled={start.busy} onClick={() => void start.run()}>
            EVERYBODY'S IN! ▶
          </button>
          <ErrorLine message={settings.error ?? start.error} />
        </Panel>
      ) : (
        <Panel>
          <p class="m-0 mb-3 text-center text-sm text-[#EEEADE]">
            {room.totalRounds} rounds · {seconds}s each
          </p>
          <WaitingForHost game={game} label="Waiting for" />
        </Panel>
      )}

      <Panel>
        <h2 class="pixel m-0 mb-3 text-[10px] text-[#DFEB8E]">HOW TO PLAY</h2>
        <ul class="m-0 flex list-none flex-col gap-2 p-0 text-sm text-[#EEEADE]">
          <li>▸ A Web Chef's headshot starts as a chunky pixel blob.</li>
          <li>▸ It sharpens every couple of seconds. Pick the right name.</li>
          <li>▸ Faster = more points (up to 1000). First correct answer gets +250.</li>
          <li>▸ One guess per round. Wrong guess = 0 points.</li>
        </ul>
      </Panel>
    </div>
  );
}
