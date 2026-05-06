import { readFileSync, statSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

statSync("node_modules/.bin/trawly");

const { parseLockfile } = await import("trawly");
const packages = parseLockfile("fixtures/package-lock.json");
assert(packages[0]?.name === "lodash", "expected library export to parse lodash");

const json = JSON.parse(readFileSync("artifacts/trawly.json", "utf8"));
assert(json.packagesScanned === 1, "expected one package to be scanned");
assert(
  json.findings.some(
    (finding) =>
      finding.packageName === "lodash" &&
      finding.installedVersion === "4.17.20" &&
      finding.source === "osv",
  ),
  "expected an OSV finding for lodash@4.17.20",
);
assert(
  json.findings.some(
    (finding) =>
      finding.id === "TRAWLY-ENV-SECRET" &&
      finding.packageName === "DATABASE_URL" &&
      finding.line === 2,
  ),
  "expected env secret finding for DATABASE_URL",
);
assert(
  !JSON.stringify(json).includes("postgres://smoke:secret"),
  "env secret values must not appear in JSON output",
);

const npxJson = JSON.parse(readFileSync("artifacts/npx-tarball.json", "utf8"));
assert(
  npxJson.findings.some((finding) => finding.packageName === "lodash"),
  "expected npm exec tarball run to report lodash",
);
assert(
  npxJson.findings.some((finding) => finding.id === "TRAWLY-ENV-SECRET"),
  "expected npm exec tarball run to report env secret",
);

const sarif = JSON.parse(readFileSync("artifacts/trawly.sarif", "utf8"));
assert(sarif.version === "2.1.0", "expected SARIF v2.1.0");
assert(
  sarif.runs?.[0]?.results?.some((result) =>
    String(result.message?.text ?? "").includes("lodash"),
  ),
  "expected SARIF to contain a lodash result",
);
assert(
  sarif.runs?.[0]?.results?.some((result) =>
    String(result.message?.text ?? "").includes("DATABASE_URL"),
  ),
  "expected SARIF to contain an env secret result",
);

const markdown = readFileSync("artifacts/trawly.md", "utf8");
assert(markdown.includes("lodash"), "expected Markdown to mention lodash");
assert(markdown.includes("DATABASE_URL"), "expected Markdown to mention env key");

console.log("trawly publish smoke passed");
