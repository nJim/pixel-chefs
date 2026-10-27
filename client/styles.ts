// Brand palette (fourkitchens.com) + pixel UI kit, injected once at boot.
// Layout uses Tailwind utilities; these classes cover what utilities can't (pixel borders, keyframes).

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;700&display=swap";

const CSS = `
:root {
  --leafy: #0F2C15; --leafy-200: #244E2C; --leafy-400: #08200D;
  --kelly: #0EB747; --kelly-200: #4AC975; --kelly-400: #0B9239;
  --lime: #DFEB8E; --lime-400: #CBD96D;
  --cream: #F8F5EC; --cream-400: #EEEADE;
  --rhubarb: #E17C6F; --rhubarb-400: #B46459;
  --plum: #764775; --pink: #E7BFBE;
  --px: 4px;
}
html, body { background: var(--leafy); color: var(--cream); }
body {
  margin: 0;
  font-family: "Space Grotesk", system-ui, sans-serif;
  background-color: var(--leafy);
  background-image:
    linear-gradient(rgba(14,183,71,.06) 2px, transparent 2px),
    linear-gradient(90deg, rgba(14,183,71,.06) 2px, transparent 2px);
  background-size: 32px 32px;
  -webkit-tap-highlight-color: transparent;
}
.pixel { font-family: "Press Start 2P", monospace; letter-spacing: .02em; line-height: 1.5; }
.pixelated { image-rendering: pixelated; }

/* Stepped "pixel corner" border: 4 offset shadows + a hard drop shadow. */
.pc-panel {
  background: var(--leafy-200);
  box-shadow:
    0 calc(var(--px) * -1) 0 0 var(--cream), 0 var(--px) 0 0 var(--cream),
    calc(var(--px) * -1) 0 0 0 var(--cream), var(--px) 0 0 0 var(--cream),
    calc(var(--px) * 2) calc(var(--px) * 3) 0 0 var(--leafy-400);
  margin: var(--px);
}

.pc-btn {
  --bg: var(--kelly); --fg: var(--leafy-400); --edge: var(--kelly-400);
  font-family: "Press Start 2P", monospace; font-size: 12px; line-height: 1.6;
  color: var(--fg); background: var(--bg); border: 0; cursor: pointer;
  padding: 14px 18px; margin: var(--px); position: relative;
  box-shadow:
    0 calc(var(--px) * -1) 0 0 var(--leafy-400), 0 var(--px) 0 0 var(--leafy-400),
    calc(var(--px) * -1) 0 0 0 var(--leafy-400), var(--px) 0 0 0 var(--leafy-400),
    inset 0 calc(var(--px) * -1.5) 0 0 var(--edge);
  transition: transform 60ms steps(2);
  user-select: none;
}
.pc-btn:hover:not(:disabled) { filter: brightness(1.08); }
.pc-btn:active:not(:disabled) { transform: translateY(var(--px)); box-shadow:
    0 calc(var(--px) * -1) 0 0 var(--leafy-400), 0 var(--px) 0 0 var(--leafy-400),
    calc(var(--px) * -1) 0 0 0 var(--leafy-400), var(--px) 0 0 0 var(--leafy-400); }
.pc-btn:disabled { opacity: .45; cursor: not-allowed; }
.pc-btn:focus-visible { outline: 3px dashed var(--lime); outline-offset: 6px; }
.pc-btn--lime { --bg: var(--lime); --edge: var(--lime-400); }
.pc-btn--cream { --bg: var(--cream); --edge: var(--cream-400); }
.pc-btn--ghost { --bg: var(--leafy-200); --fg: var(--cream); --edge: var(--leafy-400); }
.pc-btn--rhubarb { --bg: var(--rhubarb); --edge: var(--rhubarb-400); }
.pc-btn--sm { font-size: 10px; padding: 8px 10px; }
.pc-btn.is-on { --bg: var(--lime); --edge: var(--lime-400); --fg: var(--leafy-400); }

.pc-input {
  font-family: "Press Start 2P", monospace; font-size: 14px;
  background: var(--cream); color: var(--leafy-400); border: 0; padding: 14px 12px;
  margin: var(--px); width: 100%; box-sizing: border-box;
  box-shadow:
    0 calc(var(--px) * -1) 0 0 var(--leafy-400), 0 var(--px) 0 0 var(--leafy-400),
    calc(var(--px) * -1) 0 0 0 var(--leafy-400), var(--px) 0 0 0 var(--leafy-400),
    inset 0 var(--px) 0 0 var(--cream-400);
}
.pc-input::placeholder { color: #9a9a8f; }
.pc-input:focus { outline: 3px dashed var(--lime); outline-offset: 6px; }

/* Answer buttons */
.pc-option { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 17px; line-height: 1.2;
  text-align: left; min-height: 64px; display: flex; align-items: center; gap: 12px; width: calc(100% - 8px); }
.pc-option .key { font-family: "Press Start 2P", monospace; font-size: 10px; background: var(--leafy-400);
  color: var(--lime); padding: 6px 7px; flex-shrink: 0; }
.pc-option.is-correct { --bg: var(--kelly-200); --edge: var(--kelly-400); animation: pc-bounce .5s steps(4); }
.pc-option.is-wrong { --bg: var(--rhubarb); --edge: var(--rhubarb-400); animation: pc-shake .4s steps(6); }
.pc-option.is-dim { opacity: .35; }

.pc-avatar { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-family: "Press Start 2P", monospace; color: var(--leafy-400);
  box-shadow: 0 -3px 0 0 var(--leafy-400), 0 3px 0 0 var(--leafy-400), -3px 0 0 0 var(--leafy-400), 3px 0 0 0 var(--leafy-400);
  margin: 3px; position: relative; }

.pc-photo { box-shadow:
    0 -6px 0 0 var(--cream), 0 6px 0 0 var(--cream), -6px 0 0 0 var(--cream), 6px 0 0 0 var(--cream),
    12px 16px 0 0 var(--leafy-400);
  margin: 6px; background: var(--leafy-400); display: block; }

.pc-timer { height: 16px; background: var(--leafy-400); position: relative; overflow: hidden; }
.pc-timer > span { position: absolute; inset: 0 auto 0 0; background: var(--lime);
  -webkit-mask: repeating-linear-gradient(90deg, #000 0 12px, transparent 12px 16px);
          mask: repeating-linear-gradient(90deg, #000 0 12px, transparent 12px 16px); }
.pc-timer.is-low > span { background: var(--rhubarb); animation: pc-blink .5s steps(1) infinite; }

.pc-logo { color: var(--lime); text-shadow: 4px 4px 0 var(--kelly-400), 8px 8px 0 var(--leafy-400); }

.pc-pop { animation: pc-pop .35s steps(4) both; }
.pc-blink { animation: pc-blink 1s steps(1) infinite; }
.pc-float { animation: pc-float 1.6s steps(4) infinite alternate; }
.pc-zoom { animation: pc-zoom .6s steps(6) both; }

@keyframes pc-pop { 0% { transform: scale(.4); opacity: 0 } 70% { transform: scale(1.12) } 100% { transform: scale(1); opacity: 1 } }
@keyframes pc-blink { 50% { opacity: 0 } }
@keyframes pc-shake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-8px) } 40%,80% { transform: translateX(8px) } }
@keyframes pc-bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes pc-float { from { transform: translateY(0) } to { transform: translateY(-8px) } }
@keyframes pc-zoom { from { transform: scale(2.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }

@media (prefers-reduced-motion: reduce) {
  .pc-pop, .pc-blink, .pc-float, .pc-zoom, .pc-option.is-correct, .pc-option.is-wrong, .pc-timer.is-low > span { animation: none; }
}
`;

export function injectStyles() {
  if (typeof document === "undefined" || document.getElementById("pc-styles")) return;
  const fonts = document.createElement("link");
  fonts.rel = "stylesheet";
  fonts.href = FONTS_URL;
  document.head.appendChild(fonts);
  const style = document.createElement("style");
  style.id = "pc-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
  document.title = "Pixel Chefs";
}
