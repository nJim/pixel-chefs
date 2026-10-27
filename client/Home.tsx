import { useMutation } from "@spacefast/zero/client";
import { useState } from "preact/hooks";

import { cleanCode, cleanNickname } from "../shared/scoring";
import { TEAM } from "../shared/team";
import { CHEF_IMAGES } from "./chef-images";
import { PixelImage } from "./PixelImage";
import { sfx } from "./sound";
import { ErrorLine, Panel, useAction } from "./ui";

function rememberedNickname(): string {
  try {
    return localStorage.getItem("pc:nick") ?? "";
  } catch {
    return "";
  }
}

function rememberNickname(name: string) {
  try {
    localStorage.setItem("pc:nick", name);
  } catch {
    // Not persisted; fine.
  }
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <h1 class={`pixel pc-logo m-0 text-center ${small ? "text-sm" : "text-3xl sm:text-5xl"}`}>
      PIXEL
      {small ? " " : <br />}
      CHEFS
    </h1>
  );
}

/** Landing screen: host a new game or join one by code. With `lockedCode`, only joins that room. */
export function Home({ playerKey, lockedCode, onEnter }: { playerKey: string; lockedCode?: string; onEnter: (code: string) => void }) {
  const [nickname, setNickname] = useState(rememberedNickname);
  const [code, setCode] = useState(lockedCode ?? "");
  const createRoom = useMutation<[string, string], string>("createRoom");
  const joinRoom = useMutation<[string, string, string], string>("joinRoom");
  const [teaser] = useState(() => TEAM[Math.floor(Math.random() * TEAM.length)].id);

  const name = cleanNickname(nickname);
  // Enter submits whichever action the form is set up for: join if there's a code, otherwise host.
  const joining = Boolean(lockedCode) || cleanCode(code).length === 4;

  const host = useAction(async () => {
    rememberNickname(name);
    const roomCode = await createRoom(name, playerKey);
    sfx.join();
    onEnter(roomCode);
  });

  const join = useAction(async () => {
    rememberNickname(name);
    const roomCode = await joinRoom(cleanCode(code), name, playerKey);
    sfx.join();
    onEnter(roomCode);
  });

  return (
    <div class="flex flex-col items-center gap-6">
      <div class="pc-float mt-2">
        <PixelImage src={CHEF_IMAGES[teaser]} blocks={8} size={120} label="A very pixelated Web Chef" />
      </div>
      <Logo />
      <p class="max-w-sm text-center text-[#EEEADE]">Can you name your fellow Web Chef before the pixels clear up?</p>

      <Panel class="w-full max-w-md">
        <form
          class="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            if (joining) void join.run();
            else void host.run();
          }}
        >
          <label class="flex flex-col gap-2">
            <span class="pixel text-[10px] text-[#DFEB8E]">YOUR NAME</span>
            <input
              class="pc-input"
              value={nickname}
              maxLength={16}
              autoComplete="nickname"
              placeholder="e.g. Pixel Pat"
              onInput={(e) => setNickname(e.currentTarget.value)}
            />
          </label>

          <div class="flex flex-col gap-2">
            <span class="pixel text-[10px] text-[#DFEB8E]">ROOM CODE</span>
            <div class="flex items-stretch gap-2">
              <input
                class="pc-input uppercase tracking-[0.3em]"
                value={code}
                maxLength={4}
                disabled={Boolean(lockedCode)}
                autoCapitalize="characters"
                placeholder="ABCD"
                aria-label="Room code"
                onInput={(e) => setCode(cleanCode(e.currentTarget.value))}
              />
              <button type={joining ? "submit" : "button"} class="pc-btn shrink-0" disabled={!name || cleanCode(code).length !== 4 || join.busy} onClick={(e) => { e.preventDefault(); void join.run(); }}>
                JOIN
              </button>
            </div>
          </div>

          {!lockedCode && (
            <>
              <div class="pixel text-center text-[10px] opacity-60">— OR —</div>
              <button type={joining ? "button" : "submit"} class="pc-btn pc-btn--lime" disabled={!name || host.busy} onClick={(e) => { e.preventDefault(); void host.run(); }}>
                HOST A NEW GAME
              </button>
            </>
          )}
          <ErrorLine message={host.error ?? join.error} />
        </form>
      </Panel>
    </div>
  );
}
