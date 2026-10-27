import { useMutation } from "@spacefast/zero/client";
import { useEffect } from "preact/hooks";

import { CHEFS_BY_ID } from "../shared/team";
import { CHEF_IMAGES } from "./chef-images";
import { PixelImage } from "./PixelImage";
import { sfx } from "./sound";
import { Avatar, ErrorLine, Panel, type ScreenProps, Scoreboard, WaitingForHost, chefName, useAction } from "./ui";

export function Reveal({ game, playerKey }: ScreenProps) {
  const round = game.round!;
  const { room } = game;
  const chef = CHEFS_BY_ID[round.chefId];
  const results = round.results ?? [];
  const nextRound = useMutation<[string, string], void>("nextRound");
  const next = useAction(() => nextRound(room.code, playerKey));
  const isLast = round.index + 1 >= room.totalRounds;

  useEffect(() => sfx.reveal(), [round.id]);

  const deltas = new Map(results.map((r) => [r.playerId, r.points]));
  const resultFor = (playerId: string) => results.find((r) => r.playerId === playerId);

  return (
    <div class="flex flex-col items-center gap-6">
      <p class="pixel m-0 text-[10px] text-[#DFEB8E]">
        ROUND {round.index + 1}/{room.totalRounds} · IT WAS…
      </p>
      <div class="pc-pop">
        <PixelImage src={CHEF_IMAGES[round.chefId]} blocks={0} size={240} label={chef?.name ?? "Web Chef"} />
      </div>
      <div class="pc-pop text-center" style={{ animationDelay: "200ms" }}>
        <h2 class="pixel pc-logo m-0 text-lg sm:text-2xl">{chef?.name}</h2>
        <p class="m-0 mt-2 text-[#EEEADE]">{chef?.title}</p>
      </div>

      <Panel class="w-full">
        <h3 class="pixel m-0 mb-3 text-[10px] text-[#DFEB8E]">WHO SAID WHAT</h3>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          {game.players.map((player) => {
            const r = resultFor(player.id);
            return (
              <li key={player.id} class="flex items-center gap-3">
                <Avatar player={player} size={28} />
                <span class="min-w-0 flex-1 truncate">
                  <b>{player.nickname}</b>
                  <span class="opacity-70"> · {r ? chefName(r.choice) : "no answer"}</span>
                </span>
                {r?.firstBlood && <span class="pixel text-[8px] text-[#E17C6F]">⚡FIRST</span>}
                <span class={`pixel text-[10px] ${r?.correct ? "text-[#4AC975]" : "text-[#E17C6F]"}`}>
                  {r?.correct ? `+${r.points}` : "✖"}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel class="w-full">
        <h3 class="pixel m-0 mb-3 text-[10px] text-[#DFEB8E]">LEADERBOARD</h3>
        <Scoreboard game={game} deltas={deltas} />
      </Panel>

      {room.isHost ? (
        <button class="pc-btn pc-btn--lime text-sm" disabled={next.busy} onClick={() => void next.run()}>
          {isLast ? "FINAL SCORES ▶" : "NEXT CHEF ▶"}
        </button>
      ) : (
        <WaitingForHost game={game} label="Waiting for" />
      )}
      <ErrorLine message={next.error} />
    </div>
  );
}
