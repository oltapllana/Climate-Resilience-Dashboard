import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboardUrl = new URL("../components/Dashboard.jsx", import.meta.url);

function windDiurnalVisibility(source, activeMeasId, windSpeedId, windDirId) {
  const speedOnlyGuard = /\{activeMeasId\s*===\s*windSpeedId\s*&&\s*\(\s*<WindDiurnalCycle\b/s;
  if (speedOnlyGuard.test(source)) return activeMeasId === windSpeedId;

  const sharedWindGuard = /\{isWindMeas\s*&&\s*windSpeedId\s*&&\s*\(/.test(source);
  const unguardedChart = /\/\*\s*Era 1\s*\*\/\}\s*<WindDiurnalCycle\b/s.test(source);
  return sharedWindGuard && unguardedChart
    ? (activeMeasId === windSpeedId || activeMeasId === windDirId) && Boolean(windSpeedId)
    : false;
}

test("WindDiurnalCycle is visible only when wind speed is selected", async () => {
  const source = await readFile(dashboardUrl, "utf8");
  const windSpeedId = "wind_speed";
  const windDirId = "wind_dir";

  assert.equal(windDiurnalVisibility(source, windSpeedId, windSpeedId, windDirId), true);
  assert.equal(windDiurnalVisibility(source, windDirId, windSpeedId, windDirId), false);
});
