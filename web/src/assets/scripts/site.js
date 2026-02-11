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
