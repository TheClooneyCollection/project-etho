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
