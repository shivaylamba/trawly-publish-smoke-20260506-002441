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

const npxJson = JSON.parse(readFileSync("artifacts/npx-tarball.json", "utf8"));
assert(
  npxJson.findings.some((finding) => finding.packageName === "lodash"),
  "expected npm exec tarball run to report lodash",
);

const sarif = JSON.parse(readFileSync("artifacts/trawly.sarif", "utf8"));
assert(sarif.version === "2.1.0", "expected SARIF v2.1.0");
assert(
  sarif.runs?.[0]?.results?.some((result) =>
    String(result.message?.text ?? "").includes("lodash"),
  ),
  "expected SARIF to contain a lodash result",
);

const markdown = readFileSync("artifacts/trawly.md", "utf8");
assert(markdown.includes("lodash"), "expected Markdown to mention lodash");

console.log("trawly publish smoke passed");
