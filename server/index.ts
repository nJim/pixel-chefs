import { boolean, capsule, endpoint, id, json, mutation, number, query, string, table } from "@spacefast/zero/server";

import {
  CODE_LETTERS,
  COUNTDOWN_MS,
  FIRST_BLOOD_BONUS,
  PLAYER_COLORS,
  roundOptions,
  SECONDS_OPTIONS,
  cleanCode,
  cleanNickname,
  pointsFor,
} from "../shared/scoring";
import { TEAM } from "../shared/team";

// Grace period for answers that left the browser just before time ran out.
const LATE_GRACE_MS = 750;

type Status = "lobby" | "playing" | "reveal" | "done";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A player is the signed-in (or guest) identity plus a per-tab key, so one
// browser can hold several seats for local testing.
function seatOf(ctx: { auth: { userId: string | null } }, playerKey: string): string {
  if (!playerKey || playerKey.length > 64) throw new Error("Missing player key.");
  return `${ctx.auth.userId ?? "anon"}:${playerKey}`;
}

export default capsule({
  name: "Pixel Chefs",
  schema: {
    rooms: table({
      code: string(),
      hostSeat: string(),
      status: string().default("lobby"),
      roundIndex: number().default(0),
      totalRounds: number().default(10),
      roundMs: number().default(20000),
      chefOrder: string().default("[]"),
    }).index("by_code", ["code"]),
    players: table({
      roomId: id("rooms"),
      seat: string(),
      nickname: string(),
      color: string(),
      score: number().default(0),
    })
      .index("by_room", ["roomId"])
      .index("by_room_seat", ["roomId", "seat"]),
    rounds: table({
      roomId: id("rooms"),
      index: number(),
      chefId: string(),
      options: string(),
      startsAt: number(),
      endsAt: number(),
      ended: boolean().default(false),
    }).index("by_room_index", ["roomId", "index"]),
    answers: table({
      roomId: id("rooms"),
      roundId: id("rounds"),
      playerId: id("players"),
      choice: string(),
      correct: boolean(),
      elapsedMs: number(),
      points: number(),
      firstBlood: boolean().default(false),
    })
      .index("by_round", ["roundId"])
      .index("by_room", ["roomId"]),
  },
  queries: {
    // Everything one screen needs, shaped so a live round never leaks the answer.
    game: query(async (ctx, code: string, playerKey: string) => {
      const room = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", cleanCode(code))).first();
      if (!room) return null;
      const seat = seatOf(ctx, playerKey);

      const players = await ctx.db.players.withIndex("by_room", (r) => r.eq("roomId", room.id)).collect();
      players.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
      const me = players.find((p) => p.seat === seat) ?? null;

      const round =
        room.status === "lobby"
          ? null
          : await ctx.db.rounds
              .withIndex("by_room_index", (r) => r.eq("roomId", room.id).eq("index", room.roundIndex))
              .first();

      const answers = round ? await ctx.db.answers.withIndex("by_round", (r) => r.eq("roundId", round.id)).collect() : [];
      const revealed = round?.ended ?? false;
      const myAnswer = me ? answers.find((a) => a.playerId === me.id) : undefined;

      let awards: { eagleEye: null | { playerId: string; elapsedMs: number }; needsGlasses: null | { playerId: string; wrong: number } } | null = null;
      if (room.status === "done") {
        const all = await ctx.db.answers.withIndex("by_room", (r) => r.eq("roomId", room.id)).collect();
        const fastest = all.filter((a) => a.correct).sort((a, b) => a.elapsedMs - b.elapsedMs)[0];
        const wrongCounts = new Map<string, number>();
        for (const a of all) if (!a.correct) wrongCounts.set(a.playerId, (wrongCounts.get(a.playerId) ?? 0) + 1);
        const [worstId, worstCount] = [...wrongCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
        awards = {
          eagleEye: fastest ? { playerId: fastest.playerId, elapsedMs: fastest.elapsedMs } : null,
          needsGlasses: worstId ? { playerId: worstId, wrong: worstCount } : null,
        };
      }

      return {
        room: {
          code: room.code,
          status: room.status as Status,
          roundIndex: room.roundIndex,
          totalRounds: room.totalRounds,
          roundMs: room.roundMs,
          isHost: room.hostSeat === seat,
          hostId: players.find((p) => p.seat === room.hostSeat)?.id ?? null,
        },
        players: players.map((p) => ({ id: p.id, nickname: p.nickname, color: p.color, score: p.score })),
        meId: me?.id ?? null,
        round: round
          ? {
              id: round.id,
              index: round.index,
              // The photo has to reach the browser to be pixelated; names stay as opaque ids until reveal.
              chefId: round.chefId,
              options: JSON.parse(round.options) as string[],
              startsAt: round.startsAt,
              endsAt: round.endsAt,
              ended: round.ended,
              answeredIds: answers.map((a) => a.playerId),
              myAnswer: myAnswer ? { choice: myAnswer.choice, correct: myAnswer.correct, points: myAnswer.points } : null,
              results: revealed
                ? answers.map((a) => ({
                    playerId: a.playerId,
                    choice: a.choice,
                    correct: a.correct,
                    points: a.points,
                    elapsedMs: a.elapsedMs,
                    firstBlood: a.firstBlood,
                  }))
                : null,
            }
          : null,
        awards,
      };
    }),
  },
  mutations: {
    createRoom: mutation(async (ctx, nickname: string, playerKey: string) => {
      const name = cleanNickname(nickname);
      if (!name) throw new Error("Pick a nickname first.");
      const seat = seatOf(ctx, playerKey);

      let code = "";
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = Array.from({ length: 4 }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join("");
        const existing = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", candidate)).first();
        if (!existing) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Couldn't find a free room code. Try again.");

      const room = await ctx.db.rooms.insert({ code, hostSeat: seat });
      await ctx.db.players.insert({ roomId: room.id, seat, nickname: name, color: PLAYER_COLORS[0] });
      ctx.invalidate("game");
      return code;
    }),

    joinRoom: mutation(async (ctx, code: string, nickname: string, playerKey: string) => {
      const name = cleanNickname(nickname);
      if (!name) throw new Error("Pick a nickname first.");
      const seat = seatOf(ctx, playerKey);
      const room = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", cleanCode(code))).first();
      if (!room) throw new Error("No game with that code.");

      const existing = await ctx.db.players.withIndex("by_room_seat", (r) => r.eq("roomId", room.id).eq("seat", seat)).first();
      if (existing) {
        await ctx.db.players.update(existing.id, { nickname: name });
      } else {
        const count = await ctx.db.players.withIndex("by_room", (r) => r.eq("roomId", room.id)).count();
        if (count >= 30) throw new Error("This game is full.");
        await ctx.db.players.insert({ roomId: room.id, seat, nickname: name, color: PLAYER_COLORS[count % PLAYER_COLORS.length] });
      }
      ctx.invalidate("game");
      return room.code;
    }),

    updateSettings: mutation(async (ctx, code: string, playerKey: string, totalRounds: number, roundSeconds: number) => {
      const room = await hostRoom(ctx, code, playerKey);
      if (room.status !== "lobby") throw new Error("Settings are locked once the game starts.");
      if (!roundOptions(TEAM.length).includes(totalRounds) || !SECONDS_OPTIONS.includes(roundSeconds)) throw new Error("Invalid settings.");
      await ctx.db.rooms.update(room.id, { totalRounds: Math.min(totalRounds, TEAM.length), roundMs: roundSeconds * 1000 });
      ctx.invalidate("game");
    }),

    startGame: mutation(async (ctx, code: string, playerKey: string) => {
      const room = await hostRoom(ctx, code, playerKey);

      // Play-again: clear the previous game's rounds, answers and scores.
      for (const answer of await ctx.db.answers.withIndex("by_room", (r) => r.eq("roomId", room.id)).collect()) {
        await ctx.db.answers.delete(answer.id);
      }
      for (const round of await ctx.db.rounds.withIndex("by_room_index", (r) => r.eq("roomId", room.id)).collect()) {
        await ctx.db.rounds.delete(round.id);
      }
      for (const player of await ctx.db.players.withIndex("by_room", (r) => r.eq("roomId", room.id)).collect()) {
        await ctx.db.players.update(player.id, { score: 0 });
      }

      const chefOrder = shuffle(TEAM.map((c) => c.id)).slice(0, Math.min(room.totalRounds, TEAM.length));
      await ctx.db.rooms.update(room.id, { status: "playing", roundIndex: 0, chefOrder: JSON.stringify(chefOrder) });
      await createRound(ctx, room.id, 0, chefOrder[0], room.roundMs);
      ctx.invalidate("game");
    }),

    submitAnswer: mutation(async (ctx, code: string, playerKey: string, roundId: string, choice: string) => {
      const now = Date.now();
      const seat = seatOf(ctx, playerKey);
      const room = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", cleanCode(code))).first();
      if (!room || room.status !== "playing") throw new Error("No round in progress.");
      const round = await ctx.db.rounds.get(roundId);
      if (!round || round.roomId !== room.id || round.index !== room.roundIndex || round.ended) throw new Error("That round is over.");
      if (now < round.startsAt) throw new Error("Not yet!");
      if (now > round.endsAt + LATE_GRACE_MS) throw new Error("Too late!");
      const options = JSON.parse(round.options) as string[];
      if (!options.includes(choice)) throw new Error("Invalid choice.");

      const player = await ctx.db.players.withIndex("by_room_seat", (r) => r.eq("roomId", room.id).eq("seat", seat)).first();
      if (!player) throw new Error("Join the game first.");

      const answers = await ctx.db.answers.withIndex("by_round", (r) => r.eq("roundId", round.id)).collect();
      if (answers.some((a) => a.playerId === player.id)) throw new Error("You already locked in.");

      const correct = choice === round.chefId;
      const elapsedMs = Math.min(Math.max(now - round.startsAt, 0), round.endsAt - round.startsAt);
      const firstBlood = correct && !answers.some((a) => a.correct);
      const points = correct ? pointsFor(elapsedMs, room.roundMs) + (firstBlood ? FIRST_BLOOD_BONUS : 0) : 0;

      await ctx.db.answers.insert({ roomId: room.id, roundId: round.id, playerId: player.id, choice, correct, elapsedMs, points, firstBlood });
      if (points) await ctx.db.players.update(player.id, { score: player.score + points });

      // Everyone's in: no need to wait out the clock.
      const playerCount = await ctx.db.players.withIndex("by_room", (r) => r.eq("roomId", room.id)).count();
      if (answers.length + 1 >= playerCount) await finishRound(ctx, room.id, round.id);

      ctx.invalidate("game");
      return { correct, points };
    }),

    // Any client may call this when its clock runs out; it's idempotent.
    endRound: mutation(async (ctx, code: string, roundId: string) => {
      const room = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", cleanCode(code))).first();
      if (!room || room.status !== "playing") return;
      const round = await ctx.db.rounds.get(roundId);
      if (!round || round.roomId !== room.id || round.ended) return;
      if (Date.now() < round.endsAt) return;
      await finishRound(ctx, room.id, round.id);
      ctx.invalidate("game");
    }),

    nextRound: mutation(async (ctx, code: string, playerKey: string) => {
      const room = await hostRoom(ctx, code, playerKey);
      if (room.status !== "reveal") return;
      const chefOrder = JSON.parse(room.chefOrder) as string[];
      const next = room.roundIndex + 1;
      if (next >= chefOrder.length) {
        await ctx.db.rooms.update(room.id, { status: "done" });
      } else {
        await ctx.db.rooms.update(room.id, { status: "playing", roundIndex: next });
        await createRound(ctx, room.id, next, chefOrder[next], room.roundMs);
      }
      ctx.invalidate("game");
    }),

    backToLobby: mutation(async (ctx, code: string, playerKey: string) => {
      const room = await hostRoom(ctx, code, playerKey);
      await ctx.db.rooms.update(room.id, { status: "lobby" });
      ctx.invalidate("game");
    }),
  },
  endpoints: {
    // Clients sync their clocks to this so the countdown and pixel stages line up.
    time: endpoint({ method: "GET", path: "/api/time" }, () => json({ now: Date.now() })),
  },
});

type MutationCtx = Parameters<Parameters<typeof mutation>[0]>[0];

async function hostRoom(ctx: MutationCtx, code: string, playerKey: string) {
  const room = await ctx.db.rooms.withIndex("by_code", (r) => r.eq("code", cleanCode(code))).first();
  if (!room) throw new Error("No game with that code.");
  if (room.hostSeat !== seatOf(ctx, playerKey)) throw new Error("Only the host can do that.");
  return room;
}

async function createRound(ctx: MutationCtx, roomId: string, index: number, chefId: string, roundMs: number) {
  const distractors = shuffle(TEAM.filter((c) => c.id !== chefId)).slice(0, 3).map((c) => c.id);
  const startsAt = Date.now() + COUNTDOWN_MS;
  await ctx.db.rounds.insert({
    roomId,
    index,
    chefId,
    options: JSON.stringify(shuffle([chefId, ...distractors])),
    startsAt,
    endsAt: startsAt + roundMs,
  });
}

async function finishRound(ctx: MutationCtx, roomId: string, roundId: string) {
  await ctx.db.rounds.update(roundId, { ended: true });
  await ctx.db.rooms.update(roomId, { status: "reveal" });
}
