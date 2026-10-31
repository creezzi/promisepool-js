import { test } from "node:test";
import assert from "node:assert/strict";
import { pool, poolSettled } from "../src/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("keeps input order regardless of completion order", async () => {
  const out = await pool([30, 5, 15], async (ms) => { await sleep(ms); return ms * 2; }, { concurrency: 3 });
  assert.deepEqual(out, [60, 10, 30]);
});

test("never exceeds the concurrency limit", async () => {
  let active = 0;
  let peak = 0;
  await pool(Array.from({ length: 20 }, (_, i) => i), async () => {
    active++;
    peak = Math.max(peak, active);
    await sleep(3);
    active--;
  }, { concurrency: 4 });
  assert.equal(peak, 4);
});

test("a failure rejects and stops starting new work", async () => {
  const started = [];
  await assert.rejects(
    pool([1, 2, 3, 4, 5, 6], async (n) => {
      started.push(n);
      await sleep(2);
      if (n === 2) throw new Error("boom");
    }, { concurrency: 2 }),
    /boom/,
  );
  assert.ok(started.length < 6);
});

test("empty input and sync workers", async () => {
  assert.deepEqual(await pool([], async () => 1), []);
  assert.deepEqual(await pool([1, 2], (n) => n + 1), [2, 3]);
});

test("validates concurrency", async () => {
  await assert.rejects(pool([1], async () => 1, { concurrency: 0 }), RangeError);
});

test("poolSettled reports each outcome", async () => {
  const out = await poolSettled([1, 2], async (n) => { if (n === 2) throw new Error("no"); return n; });
  assert.equal(out[0].status, "fulfilled");
  assert.equal(out[1].status, "rejected");
  assert.equal(out[1].reason.message, "no");
});
