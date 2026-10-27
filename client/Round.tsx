import { useMutation } from "@spacefast/zero/client";
import { useEffect, useRef, useState } from "preact/hooks";

import { PIXEL_STAGES, pointsFor, stageIndexAt } from "../shared/scoring";
import { CHEF_IMAGES } from "./chef-images";
import { useServerNow } from "./clock";
import { PixelImage } from "./PixelImage";
import { sfx } from "./sound";
import { Avatar, ErrorLine, type ScreenProps, chefName, useAction } from "./ui";

const KEYS = ["A", "B", "C", "D"];

export function Round({ game, playerKey }: ScreenProps) {
  const round = game.round!;
  const { room } = game;
  const now = useServerNow(50);
  const submitAnswer = useMutation<[string, string, string, string], { correct: boolean; points: number }>("submitAnswer");
  const endRound = useMutation<[string, string], void>("endRound");
  const [pending, setPending] = useState<string | null>(null);

  const elapsed = now - round.startsAt;
  const countdown = Math.ceil((round.startsAt - now) / 1000);
  const live = elapsed >= 0;
  const remaining = Math.max(0, round.endsAt - now);
  const stage = stageIndexAt(elapsed, room.roundMs);
  const mine = round.myAnswer;
  const choice = mine?.choice ?? pending;
  const isPlayer = Boolean(game.meId);

  // Sound cues: countdown ticks, then a blip each time the photo sharpens.
  const lastCount = useRef<number | null>(null);
  useEffect(() => {
    if (!live && countdown !== lastCount.current && countdown <= 3) sfx.tick();
    lastCount.current = countdown;
  }, [countdown, live]);
  const lastStage = useRef(-1);
  useEffect(() => {
    if (!live) return;
    if (lastStage.current === -1) sfx.go();
    else if (stage !== lastStage.current && !mine) sfx.sharpen();
    lastStage.current = stage;
  }, [stage, live]);

  // Any client whose clock runs out nudges the server; the server double-checks the time.
  const ending = useRef(false);
  useEffect(() => {
    if (remaining > 0 || round.ended || ending.current) return;
    ending.current = true;
    const retry = setTimeout(() => (ending.current = false), 2000);
    void endRound(room.code, round.id).catch(() => undefined);
    return () => clearTimeout(retry);
  }, [remaining, round.ended]);

  const answer = useAction(async (chefId: string) => {
    setPending(chefId);
    try {
      const result = await submitAnswer(room.code, playerKey, round.id, chefId);
      if (result.correct) sfx.correct();
      else sfx.wrong();
    } catch (err) {
      setPending(null);
      throw err;
    }
  });

  const potential = live ? pointsFor(elapsed, room.roundMs) : 1000;
  const lowTime = remaining < 4000;

  return (
    <div class="flex flex-col items-center gap-5">
      <div class="flex w-full items-center justify-between gap-2">
        <span class="pixel text-[10px] text-[#DFEB8E]">
          ROUND {round.index + 1}/{room.totalRounds}
        </span>
        <span class="pixel text-[10px]">{live && !mine ? `${potential} PTS` : ""}</span>
      </div>

      <div class={`pc-timer w-full ${lowTime && live ? "is-low" : ""}`} role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={room.roundMs} aria-valuenow={remaining}>
        <span style={{ width: `${live ? (remaining / room.roundMs) * 100 : 100}%` }} />
      </div>

      <div class="relative">
        <PixelImage
          src={CHEF_IMAGES[round.chefId]}
          blocks={live ? PIXEL_STAGES[stage] : 3}
          label="Pixelated mystery Web Chef"
        />
        {!live && (
          <div class="absolute inset-0 flex items-center justify-center bg-[#08200D]/80">
            <span key={countdown} class="pixel pc-zoom pc-logo text-7xl">
              {countdown > 0 ? countdown : "GO"}
            </span>
          </div>
        )}
      </div>

      {isPlayer ? (
        <div class="grid w-full grid-cols-1 sm:grid-cols-2">
          {round.options.map((chefId, i) => {
            const picked = choice === chefId;
            const state = mine && picked ? (mine.correct ? "is-correct" : "is-wrong") : choice && !picked ? "is-dim" : picked ? "is-on" : "";
            return (
              <button
                key={chefId}
                class={`pc-btn pc-btn--cream pc-option ${state}`}
                disabled={!live || Boolean(choice) || remaining === 0}
                onClick={() => void answer.run(chefId)}
              >
                <span class="key">{KEYS[i]}</span>
                <span class="flex-1">{chefName(chefId)}</span>
                {mine && picked && <span class="pixel text-xs">{mine.correct ? `+${mine.points}` : "✖"}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p class="pixel text-[10px] text-[#DFEB8E]">Spectating. Join from the home screen to play.</p>
      )}
      <ErrorLine message={answer.error} />

      <div class="flex w-full flex-col items-center gap-2">
        <p class="pixel m-0 text-[10px] opacity-70">
          {mine ? (mine.correct ? "NICE! " : "OOF. ") : ""}
          {round.answeredIds.length}/{game.players.length} LOCKED IN
        </p>
        <ul class="m-0 flex list-none flex-wrap justify-center gap-1 p-0">
          {game.players.map((player) => {
            const done = round.answeredIds.includes(player.id);
            return (
              <li key={player.id} title={player.nickname} class={done ? "pc-pop" : "opacity-30"}>
                <Avatar player={player} size={28} badge={done ? "✔" : undefined} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
