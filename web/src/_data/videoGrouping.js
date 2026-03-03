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

function toMonthKey(parsed) {
  return `${parsed.year}-${String(parsed.month).padStart(2, "0")}`;
}

function buildVideosByMonth(videos) {
  const buckets = new Map();

  for (const video of videos) {
    const parsed = getYearMonth(video.date);
    if (!parsed) {
      continue;
    }

    const key = toMonthKey(parsed);
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

  return [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export { buildVideosByMonth, getYearMonth, toMonthKey };
