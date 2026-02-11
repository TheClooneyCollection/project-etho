import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveEnrichedJsonPath() {
  const configuredPath = process.env.ENRICHED_JSON_PATH;
  if (configuredPath) {
    return configuredPath;
  }

  const candidates = [
    // Case 1: Resolve from this file's location in the default repo layout.
    path.resolve(__dirname, "../../../sheet-pipeline/out/out.enriched.json"),
    // Case 2: Resolve when running from `web/` as the current working directory.
    path.resolve(process.cwd(), "../sheet-pipeline/out/out.enriched.json"),
    // Case 3: Resolve when running from repo root as the current working directory.
    path.resolve(process.cwd(), "sheet-pipeline/out/out.enriched.json")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function readEnrichedFile() {
  try {
    const raw = fs.readFileSync(resolveEnrichedJsonPath(), "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return { videos: [] };
  }
}

function normalizeVideo(video) {
  return {
    date: video["Date"] || "",
    mediaType: video["Media type"] || "",
    contentType: video["Content type"] || "",
    creator: (video["Creator"] || "").trim(),
    notes: video["Notes"] || "",
    timestamp1: {
      link: video["timestamp 1 link"] || "",
      thumbnail: video["timestamp 1 thumbnail"] || "",
      title: video["timestamp 1 title"] || ""
    },
    timestamp2: {
      link: video["timestamp 2 link"] || ""
    }
  };
}

export default readEnrichedFile().videos.map(normalizeVideo);
