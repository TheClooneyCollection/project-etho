import creatorIndex from "./creatorIndex.js";
import enrichedVideos from "./enrichedVideos.js";

const videosByCreatorMap = new Map();

for (const creator of creatorIndex) {
  videosByCreatorMap.set(creator.key, {
    key: creator.key,
    pathKey: creator.pathKey,
    name: creator.name,
    videoCount: creator.videoCount,
    months: creator.months,
    videos: []
  });
}

for (const video of enrichedVideos) {
  const creatorKey = String(video.creatorKey || "").trim().toLowerCase();
  if (!creatorKey || !videosByCreatorMap.has(creatorKey)) {
    continue;
  }
  videosByCreatorMap.get(creatorKey).videos.push(video);
}

for (const creator of videosByCreatorMap.values()) {
  creator.videos.sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return String(a.timestamp1.title || "").localeCompare(String(b.timestamp1.title || ""));
  });
}

export default [...videosByCreatorMap.values()];
