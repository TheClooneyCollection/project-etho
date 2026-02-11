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
