import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_POINTS,
  MIN_POINTS,
  PIXEL_STAGES,
  cleanCode,
  cleanNickname,
  pointsFor,
  roundOptions,
  stageIndexAt,
} from "../shared/scoring.ts";

describe("roundOptions", () => {
  it("offers the presets plus the whole team", () => {
    assert.deepEqual(roundOptions(30), [5, 10, 15, 30]);
  });

  it("drops presets that don't fit a small team", () => {
    assert.deepEqual(roundOptions(12), [5, 10, 12]);
    assert.deepEqual(roundOptions(10), [5, 10]);
  });
});

describe("pointsFor", () => {
  it("awards full points for an instant answer", () => {
    assert.equal(pointsFor(0, 20000), MAX_POINTS);
  });

  it("decays linearly with time", () => {
    assert.equal(pointsFor(5000, 20000), 750);
    assert.equal(pointsFor(10000, 20000), 500);
  });

  it("never drops below the floor, even past the deadline", () => {
    assert.equal(pointsFor(19900, 20000), MIN_POINTS);
    assert.equal(pointsFor(99999, 20000), MIN_POINTS);
  });

  it("treats negative elapsed time as instant", () => {
    assert.equal(pointsFor(-500, 20000), MAX_POINTS);
  });
});

describe("stageIndexAt", () => {
  it("starts at the chunkiest stage", () => {
    assert.equal(stageIndexAt(0, 20000), 0);
    assert.equal(stageIndexAt(-1000, 20000), 0);
  });

  it("only ever sharpens over time", () => {
    let previous = 0;
    for (let t = 0; t <= 20000; t += 250) {
      const stage = stageIndexAt(t, 20000);
      assert.ok(stage >= previous, `stage went backwards at ${t}ms`);
      previous = stage;
    }
  });

  it("reaches full resolution by 85% of the round and stays there", () => {
    const last = PIXEL_STAGES.length - 1;
    assert.equal(PIXEL_STAGES[last], 0);
    assert.equal(stageIndexAt(17000, 20000), last);
    assert.equal(stageIndexAt(60000, 20000), last);
    assert.ok(stageIndexAt(16000, 20000) < last);
  });
});

describe("input cleaning", () => {
  it("normalizes room codes to four uppercase letters", () => {
    assert.equal(cleanCode(" ab-cd9e "), "ABCD");
    assert.equal(cleanCode("xy"), "XY");
  });

  it("trims and collapses nicknames to 16 characters", () => {
    assert.equal(cleanNickname("  Pixel    Pat  "), "Pixel Pat");
    assert.equal(cleanNickname("a".repeat(30)).length, 16);
  });
});
