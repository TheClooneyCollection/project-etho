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

(function initCreatorFilter() {
  const container = document.querySelector(".js-creator-filter");
  if (!container) {
    return;
  }

  const currentMonth = String(container.getAttribute("data-current-month") || "").trim();
  const optionNodes = [...container.querySelectorAll(".js-creator-option[data-creator-key]")];
  const cards = [...document.querySelectorAll(".video-card[data-video-creator-key]")];
  const emptyState = container.querySelector(".js-creator-empty");
  const activeState = container.querySelector(".js-creator-active");
  const clearButton = container.querySelector(".js-creator-clear");
  const routeNodes = [...document.querySelectorAll(".month-picker__routes [data-month]")];
  const prevLinks = [...document.querySelectorAll(".js-month-pagination-prev")];
  const nextLinks = [...document.querySelectorAll(".js-month-pagination-next")];

  if (!optionNodes.length) {
    return;
  }

  const monthToBaseHref = {};
  routeNodes.forEach((node) => {
    const month = node.getAttribute("data-month");
    const baseHref = node.getAttribute("data-base-href") || node.getAttribute("href");
    if (!month || !baseHref) {
      return;
    }
    monthToBaseHref[month] = baseHref;
  });

  const creatorsByKey = {};
  optionNodes.forEach((node) => {
    const key = String(node.getAttribute("data-creator-key") || "").trim().toLowerCase();
    if (!key) {
      return;
    }

    const months = String(node.getAttribute("data-months") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    creatorsByKey[key] = {
      key,
      name: String(node.getAttribute("data-creator-name") || "").trim(),
      videoCount: Number.parseInt(node.getAttribute("data-video-count") || "0", 10) || 0,
      months
    };
  });

  function withCreatorQuery(href, creatorKey) {
    if (!creatorKey) {
      return href;
    }
    try {
      const parsed = new URL(href, window.location.origin);
      parsed.searchParams.set("creator", creatorKey);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (_error) {
      const separator = href.includes("?") ? "&" : "?";
      return `${href}${separator}creator=${encodeURIComponent(creatorKey)}`;
    }
  }

  function getMonthLabelParts(monthKey) {
    const year = Number.parseInt(monthKey.slice(0, 4), 10);
    const month = Number.parseInt(monthKey.slice(5, 7), 10);
    if (!year || !month) {
      return null;
    }
    return { year, month };
  }

  function setLocalizedMonthText(node, monthKey) {
    const parts = getMonthLabelParts(monthKey);
    if (!parts) {
      node.textContent = monthKey;
      return;
    }

    node.setAttribute("data-year", String(parts.year));
    node.setAttribute("data-month", String(parts.month));

    if (!("Intl" in window)) {
      node.textContent = monthKey;
      return;
    }

    const parsed = new Date(Date.UTC(parts.year, parts.month - 1, 1));
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long"
    });
    node.textContent = formatter.format(parsed);
  }

  function resolveTargetMonth(selectedMonth, availableMonths) {
    if (!selectedMonth || !availableMonths.length) {
      return null;
    }
    if (availableMonths.includes(selectedMonth)) {
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

  function findAdjacentMonths(current, availableMonths) {
    const newer = availableMonths.filter((month) => month > current).sort();
    const older = availableMonths.filter((month) => month < current).sort();
    return {
      previous: newer.length ? newer[0] : null,
      next: older.length ? older[older.length - 1] : null
    };
  }

  function updateNavLinks(links, targetMonth, creatorKey) {
    links.forEach((link) => {
      if (!targetMonth) {
        link.hidden = true;
        return;
      }

      const baseHref = monthToBaseHref[targetMonth] || link.getAttribute("data-base-href");
      if (!baseHref) {
        link.hidden = true;
        return;
      }

      link.hidden = false;
      link.setAttribute("href", withCreatorQuery(baseHref, creatorKey));
      link.setAttribute("data-month", targetMonth);

      const monthNode = link.querySelector(".js-locale-month");
      if (monthNode) {
        setLocalizedMonthText(monthNode, targetMonth);
      }
    });
  }

  function updateMonthPickerRoutes(activeCreator) {
    routeNodes.forEach((node) => {
      const month = node.getAttribute("data-month");
      const baseHref = node.getAttribute("data-base-href") || node.getAttribute("href");
      if (!month || !baseHref) {
        return;
      }

      if (!activeCreator) {
        node.setAttribute("href", baseHref);
        return;
      }

      if (activeCreator.months.includes(month)) {
        node.setAttribute("href", withCreatorQuery(baseHref, activeCreator.key));
      } else {
        node.setAttribute("href", "");
      }
    });
  }

  function applyFilter(activeCreator) {
    let visibleCount = 0;

    cards.forEach((card) => {
      const creatorKey = String(card.getAttribute("data-video-creator-key") || "").trim().toLowerCase();
      const matches = !activeCreator || creatorKey === activeCreator.key;
      card.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = !(activeCreator && visibleCount === 0);
    }

    if (activeState) {
      if (activeCreator) {
        activeState.hidden = false;
        activeState.textContent = `Showing ${activeCreator.name} (${activeCreator.videoCount})`;
      } else {
        activeState.hidden = true;
        activeState.textContent = "";
      }
    }

    if (clearButton) {
      clearButton.hidden = !activeCreator;
    }

    optionNodes.forEach((node) => {
      const creatorKey = String(node.getAttribute("data-creator-key") || "").trim().toLowerCase();
      node.classList.toggle("is-active", Boolean(activeCreator) && creatorKey === activeCreator.key);
    });

    updateMonthPickerRoutes(activeCreator);

    if (!activeCreator) {
      updateNavLinks(prevLinks, null, "");
      updateNavLinks(nextLinks, null, "");

      prevLinks.forEach((link) => {
        const baseHref = link.getAttribute("data-base-href");
        if (!baseHref) {
          return;
        }
        link.hidden = false;
        link.setAttribute("href", baseHref);
      });
      nextLinks.forEach((link) => {
        const baseHref = link.getAttribute("data-base-href");
        if (!baseHref) {
          return;
        }
        link.hidden = false;
        link.setAttribute("href", baseHref);
      });
      return;
    }

    const adjacent = findAdjacentMonths(currentMonth, activeCreator.months);
    updateNavLinks(prevLinks, adjacent.previous, activeCreator.key);
    updateNavLinks(nextLinks, adjacent.next, activeCreator.key);
  }

  optionNodes.forEach((node) => {
    const creatorKey = String(node.getAttribute("data-creator-key") || "").trim().toLowerCase();
    if (!creatorKey || !creatorsByKey[creatorKey]) {
      return;
    }

    const creator = creatorsByKey[creatorKey];
    const firstMonth = creator.months[0];
    const baseHref = (firstMonth && monthToBaseHref[firstMonth]) || node.getAttribute("data-base-href") || "/";
    node.setAttribute("href", withCreatorQuery(baseHref, creatorKey));
  });

  const params = new URLSearchParams(window.location.search);
  const activeCreatorKey = String(params.get("creator") || "").trim().toLowerCase();
  const activeCreator = creatorsByKey[activeCreatorKey] || null;

  if (activeCreator && !activeCreator.months.includes(currentMonth)) {
    const targetMonth = resolveTargetMonth(currentMonth, activeCreator.months);
    const targetBaseHref = targetMonth ? monthToBaseHref[targetMonth] : null;
    if (targetMonth && targetBaseHref) {
      window.location.replace(withCreatorQuery(targetBaseHref, activeCreator.key));
      return;
    }
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const parsed = new URL(window.location.href);
      parsed.searchParams.delete("creator");
      window.location.assign(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    });
  }

  applyFilter(activeCreator);
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
