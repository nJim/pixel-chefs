import { useMutation } from "@spacefast/zero/client";
import { useEffect } from "preact/hooks";

import { sfx } from "./sound";
import { Avatar, ErrorLine, Panel, type Player, type ScreenProps, Scoreboard, WaitingForHost, useAction } from "./ui";

// In visual order: 2nd, 1st, 3rd.
const PLACES = [
  { height: "h-24", label: "2ND", color: "bg-[#EEEADE]" },
  { height: "h-32", label: "1ST", color: "bg-[#DFEB8E]" },
  { height: "h-16", label: "3RD", color: "bg-[#E7BFBE]" },
];

export function Podium({ game, playerKey }: ScreenProps) {
  const { room, players, awards } = game;
  const startGame = useMutation<[string, string], void>("startGame");
  const backToLobby = useMutation<[string, string], void>("backToLobby");
  const again = useAction(() => startGame(room.code, playerKey));
  const lobby = useAction(() => backToLobby(room.code, playerKey));

  useEffect(() => sfx.fanfare(), []);

  const slots = [players[1], players[0], players[2]];
  const byId = (id: string) => players.find((p) => p.id === id);

  return (
    <div class="flex flex-col items-center gap-6">
      <h2 class="pixel pc-logo m-0 text-center text-2xl">GAME OVER</h2>

      <div class="flex w-full max-w-md items-end justify-center gap-2">
        {PLACES.map((place, i) => {
          const player: Player | undefined = slots[i];
          return (
            <div key={place.label} class="flex flex-1 flex-col items-center gap-2">
              {player && (
                <div class="pc-pop flex flex-col items-center gap-1" style={{ animationDelay: `${[400, 800, 0][i]}ms` }}>
                  {i === 1 && <span class="pc-float text-2xl">👑</span>}
                  <Avatar player={player} size={i === 1 ? 56 : 44} />
                  <span class="max-w-full truncate text-sm font-bold">{player.nickname}</span>
                  <span class="pixel text-[10px]">{player.score}</span>
                </div>
              )}
              <div class={`pixel flex w-full items-start justify-center pt-2 text-xs text-[#08200D] ${place.height} ${place.color}`}>
                {place.label}
              </div>
            </div>
          );
        })}
      </div>

      {awards && (awards.eagleEye || awards.needsGlasses) && (
        <div class="grid w-full grid-cols-1 sm:grid-cols-2">
          {awards.eagleEye && byId(awards.eagleEye.playerId) && (
            <Panel>
              <p class="pixel m-0 text-[10px] text-[#DFEB8E]">🦅 EAGLE EYE</p>
              <p class="m-0 mt-2 font-bold">{byId(awards.eagleEye.playerId)!.nickname}</p>
              <p class="m-0 text-sm opacity-80">Fastest correct guess: {(awards.eagleEye.elapsedMs / 1000).toFixed(1)}s</p>
            </Panel>
          )}
          {awards.needsGlasses && byId(awards.needsGlasses.playerId) && (
            <Panel>
              <p class="pixel m-0 text-[10px] text-[#DFEB8E]">👓 NEEDS GLASSES</p>
              <p class="m-0 mt-2 font-bold">{byId(awards.needsGlasses.playerId)!.nickname}</p>
              <p class="m-0 text-sm opacity-80">
                {awards.needsGlasses.wrong} wrong guess{awards.needsGlasses.wrong === 1 ? "" : "es"}
              </p>
            </Panel>
          )}
        </div>
      )}

      <Panel class="w-full">
        <h3 class="pixel m-0 mb-3 text-[10px] text-[#DFEB8E]">FINAL SCORES</h3>
        <Scoreboard game={game} />
      </Panel>

      {room.isHost ? (
        <div class="flex flex-wrap justify-center">
          <button class="pc-btn pc-btn--lime" disabled={again.busy} onClick={() => void again.run()}>
            PLAY AGAIN ▶
          </button>
          <button class="pc-btn pc-btn--ghost" disabled={lobby.busy} onClick={() => void lobby.run()}>
            BACK TO LOBBY
          </button>
        </div>
      ) : (
        <WaitingForHost game={game} label="Waiting for" />
      )}
      <ErrorLine message={again.error ?? lobby.error} />
    </div>
  );
}
