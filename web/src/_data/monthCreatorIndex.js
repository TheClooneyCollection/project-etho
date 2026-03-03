import creatorIndex from "./creatorIndex.js";
import videosByMonth from "./videosByMonth.js";

const creatorByKey = new Map(creatorIndex.map((creator) => [creator.key, creator]));
const monthCreatorIndex = {};

for (const monthEntry of videosByMonth) {
  const counts = new Map();

  for (const video of monthEntry.videos) {
    const key = String(video.creatorKey || "").trim().toLowerCase();
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const creators = [...counts.entries()]
    .map(([key, monthCount]) => {
      const creator = creatorByKey.get(key);
      if (!creator) {
        return null;
      }
      return {
        key,
        name: creator.name,
        pathKey: creator.pathKey,
        monthCount,
        totalCount: creator.videoCount
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.monthCount !== b.monthCount) {
        return b.monthCount - a.monthCount;
      }
      if (a.totalCount !== b.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.name.localeCompare(b.name);
    });

  monthCreatorIndex[monthEntry.key] = creators;
}

export default monthCreatorIndex;
