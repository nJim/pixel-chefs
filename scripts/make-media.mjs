// Renders docs/pixel-reveal.gif: one headshot stepping through the same
// pixel stages the game uses. Run with: npm run make-media [-- "Chef Name"]
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

import { CHEF_IMAGES } from "../client/chef-images.ts";
import { PIXEL_STAGES } from "../shared/scoring.ts";
import { TEAM } from "../shared/team.ts";

const SIZE = 320;
const BORDER = 12;
const LEAFY = { r: 15, g: 44, b: 21 };
const CREAM = { r: 248, g: 245, b: 236 };

const name = process.argv[2] ?? "Jim Vomero";
const chef = TEAM.find((c) => c.name === name);
if (!chef) throw new Error(`No chef named "${name}".`);
const source = Buffer.from(CHEF_IMAGES[chef.id].split(",")[1], "base64");

// Downsample to N×N (averaging each block), then scale back up with nearest-neighbour.
async function stageFrame(blocks) {
  const pixels =
    blocks === 0
      ? await sharp(source).resize(SIZE, SIZE).toBuffer()
      : await sharp(await sharp(source).resize(blocks, blocks, { kernel: "cubic" }).toBuffer())
          .resize(SIZE, SIZE, { kernel: "nearest" })
          .toBuffer();
  return sharp(pixels)
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: CREAM })
    .extend({ top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, background: LEAFY })
    .png()
    .toBuffer();
}

const frames = await Promise.all(PIXEL_STAGES.map(stageFrame));
// Linger on the first blob and the final photo.
const delay = PIXEL_STAGES.map((_, i) => (i === 0 ? 1200 : i === PIXEL_STAGES.length - 1 ? 2400 : 450));

await mkdir("docs", { recursive: true });
await sharp(frames, { join: { animated: true } })
  .gif({ delay, loop: 0, effort: 10 })
  .toFile("docs/pixel-reveal.gif");

console.log(`Wrote docs/pixel-reveal.gif (${chef.name}, ${frames.length} frames).`);
