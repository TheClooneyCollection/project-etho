import enrichedVideos from "./enrichedVideos.js";

function getYearMonth(dateString) {
  if (!dateString || typeof dateString !== "string" || dateString.length < 7) {
    return null;
  }

  const year = Number.parseInt(dateString.slice(0, 4), 10);
  const month = Number.parseInt(dateString.slice(5, 7), 10);
  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

const buckets = new Map();

for (const video of enrichedVideos) {
  const parsed = getYearMonth(video.date);
  if (!parsed) {
    continue;
  }

  const key = `${parsed.year}-${String(parsed.month).padStart(2, "0")}`;
  if (!buckets.has(key)) {
    buckets.set(key, {
      key,
      year: parsed.year,
      month: parsed.month,
      videos: []
    });
  }

  buckets.get(key).videos.push(video);
}

const videosByMonth = [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key));

export default videosByMonth;
