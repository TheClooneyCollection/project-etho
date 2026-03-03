import enrichedVideos from "./enrichedVideos.js";
import { getYearMonth, toMonthKey } from "./videoGrouping.js";

const creators = new Map();

for (const video of enrichedVideos) {
  const creatorName = String(video.creator || "").trim();
  if (!creatorName) {
    continue;
  }

  const creatorKey = creatorName.toLowerCase();
  if (!creators.has(creatorKey)) {
    creators.set(creatorKey, {
      key: creatorKey,
      videoCount: 0,
      months: new Set(),
      variants: new Map()
    });
  }

  const creator = creators.get(creatorKey);
  creator.videoCount += 1;

  const parsed = getYearMonth(video.date);
  if (parsed) {
    creator.months.add(toMonthKey(parsed));
  }

  creator.variants.set(creatorName, (creator.variants.get(creatorName) || 0) + 1);
}

function pickDisplayName(variants) {
  let topName = "";
  let topCount = -1;
  for (const [name, count] of variants.entries()) {
    if (count > topCount || (count === topCount && name.localeCompare(topName) < 0)) {
      topName = name;
      topCount = count;
    }
  }
  return topName;
}

function toPathSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "creator";
}

const creatorIndex = [...creators.values()]
  .map((creator) => ({
    key: creator.key,
    name: pickDisplayName(creator.variants),
    videoCount: creator.videoCount,
    months: [...creator.months].sort((a, b) => b.localeCompare(a))
  }))
  .sort((a, b) => {
    if (a.videoCount !== b.videoCount) {
      return b.videoCount - a.videoCount;
    }
    return a.name.localeCompare(b.name);
  })
  .map((creator) => ({
    ...creator,
    basePathKey: toPathSlug(creator.name),
    pathKey: ""
  }));

const usedPathKeys = new Map();
for (const creator of creatorIndex) {
  const base = creator.basePathKey;
  const nextIndex = (usedPathKeys.get(base) || 0) + 1;
  usedPathKeys.set(base, nextIndex);
  creator.pathKey = nextIndex === 1 ? base : `${base}-${nextIndex}`;
  delete creator.basePathKey;
}

export default creatorIndex;
