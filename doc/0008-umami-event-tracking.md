# Umami Event Tracking

## Overview
The site uses [Umami](https://umami.is) for analytics. The tracker script is injected only in the `production` environment via `web/src/_includes/layout.njk`.

Events are tracked using HTML `data-umami-event` attributes. Umami picks these up automatically — no JavaScript required. Additional properties are passed via `data-umami-event-<property>` attributes.

## Events

### Navigation

| Event name | Element | File |
|---|---|---|
| `nav-latest` | Latest link | `month-controls.njk` |
| `nav-earliest` | Earliest link | `month-controls.njk` |
| `nav-random-month` | Random Month button | `month-controls.njk` |
| `nav-month-picker-go` | Month picker Go button | `month-controls.njk` |
| `nav-prev-month` | Previous month pagination link | `month-pagination.njk` |
| `nav-next-month` | Next month pagination link | `month-pagination.njk` |

### Creator Filter

| Event name | Properties | Element | File |
|---|---|---|---|
| `creator-filter-select` | `creator` | Creator option link | `month-controls.njk` |
| `creator-filter-clear` | | Clear filter button | `month-controls.njk` |
| `creator-view-all` | `creator` | View all link | `month-controls.njk` |

### Video Cards

| Event name | Properties | Element | File |
|---|---|---|---|
| `video-thumb-click` | `title`, `creator` | Thumbnail link | `video-card.njk` |
| `video-title-click` | `title`, `creator` | Title link | `video-card.njk` |
| `video-second-timestamp` | `creator` | Second timestamp link | `video-card.njk` |

## Adding New Events

Add `data-umami-event="<event-name>"` to any HTML element. To attach properties:

```html
<button
  data-umami-event="my-event"
  data-umami-event-foo="bar"
>Click me</button>
```

Events only fire in production (where the tracker script is loaded). They are silently ignored in development.
