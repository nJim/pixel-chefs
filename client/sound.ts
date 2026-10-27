// Tiny 8-bit sound effects with WebAudio square waves. No assets needed.

let ctx: AudioContext | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem("pc:muted") === "1";
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem("pc:muted", value ? "1" : "0");
  } catch {
    // Not persisted; fine.
  }
}

function tone(freq: number, startOffset: number, duration: number, volume = 0.06, type: OscillatorType = "square") {
  if (muted || typeof window === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + startOffset;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.setValueAtTime(0, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const sfx = {
  tick: () => tone(440, 0, 0.08),
  go: () => tone(880, 0, 0.25),
  sharpen: () => tone(1320, 0, 0.03, 0.025),
  correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.09)),
  wrong: () => [196, 147].forEach((f, i) => tone(f, i * 0.12, 0.14, 0.07, "sawtooth")),
  reveal: () => [392, 523, 659].forEach((f, i) => tone(f, i * 0.1, 0.12)),
  join: () => [660, 990].forEach((f, i) => tone(f, i * 0.06, 0.06, 0.04)),
  fanfare: () => [523, 523, 523, 698, 880, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.11)),
};
