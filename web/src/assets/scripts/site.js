(function initThemeSwitcher() {
  const storageKey = "project-etho-theme";
  const select = document.querySelector(".js-theme-select");
  if (!select) {
    return;
  }

  let saved = "system";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      saved = stored;
    }
  } catch (_error) {}

  select.value = saved;

  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") {
      document.documentElement.setAttribute("data-theme", mode);
      return;
    }
    document.documentElement.removeAttribute("data-theme");
  }

  applyTheme(saved);

  select.addEventListener("change", () => {
    const mode = select.value;
    applyTheme(mode);

    try {
      if (mode === "system") {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, mode);
      }
    } catch (_error) {}
  });
})();

(function initVideoEmbeds() {
  function parseIsoDate(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  function isOlderThanMonths(d, months) {
    if (!(d instanceof Date)) {
      return false;
    }
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return d < cutoff;
  }

  function parseTimeToSeconds(rawValue) {
    const raw = String(rawValue || "").trim();
    if (!raw) {
      return null;
    }

    if (/^\d+$/.test(raw)) {
      return Number.parseInt(raw, 10);
    }

    const match = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    if (!match) {
      return null;
    }

    const hours = Number.parseInt(match[1] || "0", 10);
    const minutes = Number.parseInt(match[2] || "0", 10);
    const seconds = Number.parseInt(match[3] || "0", 10);
    const total = (hours * 3600) + (minutes * 60) + seconds;
    return total > 0 ? total : null;
  }

  function extractYouTubeId(parsedUrl) {
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (!host.includes("youtube.com")) {
      return null;
    }

    const queryVideoId = parsedUrl.searchParams.get("v");
    if (queryVideoId) {
      return queryVideoId;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "shorts" || pathParts[0] === "embed" || pathParts[0] === "live") {
      return pathParts[1] || null;
    }

    return null;
  }

  function extractTwitchVideoId(parsedUrl) {
    const host = parsedUrl.hostname.toLowerCase();
    if (!host.includes("twitch.tv")) {
      return null;
    }

    const match = parsedUrl.pathname.match(/\/videos\/(\d+)/i);
    return match ? match[1] : null;
  }

  function buildEmbedInfo(urlValue, mediaTypeValue, dateValue) {
    const rawUrl = String(urlValue || "").trim();
    if (!rawUrl) {
      return null;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl, window.location.origin);
    } catch (_error) {
      return null;
    }

    const mediaType = String(mediaTypeValue || "").trim();
    const date = parseIsoDate(dateValue);

    const ytId = extractYouTubeId(parsedUrl);
    if (ytId) {
      const start = parseTimeToSeconds(
        parsedUrl.searchParams.get("t") || parsedUrl.searchParams.get("start")
      );

      const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        autoplay: "0"
      });
      if (start !== null) {
        params.set("start", String(start));
      }

      return {
        provider: "youtube",
        src: `https://www.youtube.com/embed/${ytId}?${params.toString()}`
      };
    }

    const twitchVideoId = extractTwitchVideoId(parsedUrl);
    if (twitchVideoId) {
      if (mediaType === "VOD⏳" && isOlderThanMonths(date, 2)) {
        return null;
      }

      const timeRaw = parsedUrl.searchParams.get("t");
      const timeSeconds = parseTimeToSeconds(timeRaw);
      const timeValue = timeSeconds !== null ? `${timeSeconds}s` : null;

      const params = new URLSearchParams();
      params.set("video", `v${twitchVideoId}`);
      params.set("autoplay", "false");
      params.append("parent", window.location.hostname);
      if (timeValue) {
        params.set("time", timeValue);
      }

      return {
        provider: "twitch",
        src: `https://player.twitch.tv/?${params.toString()}`
      };
    }

    return null;
  }

  const mediaContainers = document.querySelectorAll(".js-video-media");
  mediaContainers.forEach((container) => {
    const videoUrl = container.getAttribute("data-video-url");
    const mediaType = container.getAttribute("data-media-type");
    const videoDate = container.getAttribute("data-video-date");
    const thumbLink = container.querySelector(".js-video-thumb-link");
    const shell = container.querySelector(".js-video-embed-shell");

    if (!thumbLink || !shell) {
      return;
    }

    const embedInfo = buildEmbedInfo(videoUrl, mediaType, videoDate);
    if (!embedInfo) {
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.className = "video-card__embed";
    iframe.src = embedInfo.src;
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute(
      "allow",
      "autoplay; fullscreen; picture-in-picture; encrypted-media"
    );

    iframe.addEventListener("error", () => {
      shell.hidden = true;
      shell.innerHTML = "";
      container.classList.remove("is-embedded");
    }, { once: true });

    shell.appendChild(iframe);
    shell.hidden = false;
    container.classList.add("is-embedded");
  });
})();

(function initVideoThumbnailFallbacks() {
  const fallbackImages = [
    "/assets/images/sorry-etho-1.png",
    "/assets/images/sorry-etho-2.png"
  ];

  function pickRandomFallback(excludeSrc) {
    const normalizedExclude = String(excludeSrc || "");
    const options = fallbackImages.filter((src) => src !== normalizedExclude);
    const pool = options.length ? options : fallbackImages;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  function isValidThumbnailUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return false;
    }
    if (raw.startsWith("/assets/")) {
      return true;
    }

    try {
      const parsed = new URL(raw, window.location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (_error) {
      return false;
    }
  }

  function applyFallback(image) {
    if (!image || image.dataset.fallbackApplied === "true") {
      return;
    }

    const currentSrc = image.getAttribute("src") || "";
    const fallback = pickRandomFallback(currentSrc);
    image.dataset.fallbackApplied = "true";
    image.src = fallback;
  }

  const images = document.querySelectorAll(".js-video-thumb");
  images.forEach((image) => {
    const originalSrc = image.getAttribute("src");
    if (!isValidThumbnailUrl(originalSrc)) {
      applyFallback(image);
      return;
    }

    image.addEventListener("error", () => {
      applyFallback(image);
    }, { once: true });
  });
})();

(function formatDatesForLocale() {
  if (!("Intl" in window)) {
    return;
  }

  const dateNodes = document.querySelectorAll(".js-locale-date");
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  dateNodes.forEach((node) => {
    const raw = node.getAttribute("datetime");
    if (!raw) {
      return;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    node.textContent = dateFormatter.format(parsed);
  });

  const monthNodes = document.querySelectorAll(".js-locale-month");
  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long"
  });

  monthNodes.forEach((node) => {
    const year = Number.parseInt(node.getAttribute("data-year"), 10);
    const month = Number.parseInt(node.getAttribute("data-month"), 10);
    if (!year || !month) {
      return;
    }

    const parsed = new Date(Date.UTC(year, month - 1, 1));
    node.textContent = monthFormatter.format(parsed);
  });
})();

(function markLikelyExpiredVods() {
  const nodes = document.querySelectorAll(".js-expiry-note[data-date]");
  if (!nodes.length) {
    return;
  }

  const now = new Date();

  nodes.forEach((node) => {
    const raw = node.getAttribute("data-date");
    if (!raw) {
      return;
    }

    const publishedAt = new Date(raw);
    if (Number.isNaN(publishedAt.getTime())) {
      return;
    }

    const expiryAt = new Date(publishedAt.getTime());
    expiryAt.setMonth(expiryAt.getMonth() + 2);

    if (now >= expiryAt) {
      node.hidden = false;
    }
  });
})();

(function initMonthPicker() {
  const container = document.querySelector(".js-month-picker");
  if (!container) {
    return;
  }

  const input = container.querySelector(".js-month-picker-input");
  const goButton = container.querySelector(".js-month-picker-go");
  const routeNodes = container.querySelectorAll(".month-picker__routes [data-month]");
  if (!input || !goButton || !routeNodes.length) {
    return;
  }

  const monthToHref = {};
  routeNodes.forEach((node) => {
    const month = node.getAttribute("data-month");
    const href = node.getAttribute("href");
    if (!month || !href) {
      return;
    }
    monthToHref[month] = href;
  });

  const availableMonths = Object.keys(monthToHref).sort().reverse();
  if (!availableMonths.length) {
    return;
  }

  function resolveTargetMonth(selectedMonth) {
    if (monthToHref[selectedMonth]) {
      return selectedMonth;
    }

    if (selectedMonth >= availableMonths[0]) {
      return availableMonths[0];
    }
    if (selectedMonth <= availableMonths[availableMonths.length - 1]) {
      return availableMonths[availableMonths.length - 1];
    }

    for (const month of availableMonths) {
      if (month <= selectedMonth) {
        return month;
      }
    }

    return null;
  }

  function goToMonth() {
    const selected = String(input.value || "").trim();
    if (!selected) {
      return;
    }

    const target = resolveTargetMonth(selected);
    if (!target || !monthToHref[target]) {
      return;
    }

    window.location.assign(monthToHref[target]);
  }

  goButton.addEventListener("click", goToMonth);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToMonth();
    }
  });
})();
