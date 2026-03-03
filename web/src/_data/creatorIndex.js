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
  });

export default creatorIndex;
