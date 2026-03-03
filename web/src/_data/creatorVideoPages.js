import videosByCreator from "./videosByCreator.js";

const PAGE_SIZE = 10;

function buildCreatorHref(pathKey, pageNumber) {
  if (pageNumber <= 1) {
    return `/creator/${pathKey}/`;
  }
  return `/creator/${pathKey}/${pageNumber}/`;
}

const creatorVideoPages = [];

for (const creator of videosByCreator) {
  const totalVideos = creator.videos.length;
  const totalPages = Math.max(1, Math.ceil(totalVideos / PAGE_SIZE));

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const start = (pageNumber - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageVideos = creator.videos.slice(start, end);

    creatorVideoPages.push({
      key: `${creator.pathKey}:${pageNumber}`,
      creatorKey: creator.key,
      creatorName: creator.name,
      pathKey: creator.pathKey,
      totalVideos,
      totalPages,
      pageNumber,
      previousHref: pageNumber > 1 ? buildCreatorHref(creator.pathKey, pageNumber - 1) : "",
      nextHref: pageNumber < totalPages ? buildCreatorHref(creator.pathKey, pageNumber + 1) : "",
      videos: pageVideos
    });
  }
}

export default creatorVideoPages;
