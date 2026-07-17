import type L from 'leaflet'

/** Time the info bubble stays open after the pointer leaves the marker + bubble. */
const CLOSE_DELAY_MS = 400

/** Default popup offset: the bubble sits above the marker. */
const OFFSET_ABOVE: [number, number] = [0, -58]

/** Gap between marker and bubble when the bubble is flipped below. */
const FLIP_GAP_PX = 16

/** Clearance kept between the bubble and the filter panel's bottom edge. */
const PANEL_CLEARANCE_PX = 8

/** Fallback top exclusion zone if the filter panel can't be measured. */
const FALLBACK_TOP_SAFE_ZONE_PX = 100

/**
 * The viewport-y below which a bubble opening upward would overlap (and hide
 * behind) the fixed filter panel. Measured live from the panel element so it
 * tracks the panel's real height — collapsed/expanded and responsive — instead of
 * a hardcoded guess. A Leaflet popup lives inside the map's transformed pane (a
 * stacking context), so no z-index can lift it above elements outside the map;
 * repositioning below the marker is the only reliable fix.
 */
function topSafeZone(): number {
  const panel = document.getElementById('appt-filter-panel')
  return panel
    ? panel.getBoundingClientRect().bottom + PANEL_CLEARANCE_PX
    : FALLBACK_TOP_SAFE_ZONE_PX
}

interface HoverPopupOptions {
  /** Popup HTML (includes the action button). */
  html: string
  /** Class of the action button inside the HTML to wire the click on. */
  actionClass: string
  /** Invoked when the action button is clicked. */
  onAction: () => void
}

/**
 * Bind a marker's info bubble as a hover popup whose action button reliably
 * receives clicks. The popup opens on hover and closes shortly after the pointer
 * leaves both the marker and the bubble.
 *
 * Guards against the intermittent "button won't click" glitch:
 *   - `autoPan: false` — the map never shifts the marker/button out from under
 *     the cursor when a popup near an edge opens.
 *   - never reopen an already-open popup — avoids the DOM churn that drops the
 *     in-flight click (common with fanned-out, overlapping markers).
 *   - clear any pending close timer before scheduling a new one — no orphaned
 *     timer can close the popup mid-interaction.
 *
 * Keeps the bubble visible: when opening above would tuck it under the fixed top
 * filter panel, it flips to open below the marker (measured on open, before
 * paint, so there's no visible jump).
 */
export function bindHoverPopup(
  marker: L.Marker,
  { html, actionClass, onAction }: HoverPopupOptions,
): void {
  marker.bindPopup(html, {
    closeButton: false,
    offset: OFFSET_ABOVE,
    className: 'appt-hover-popup',
    autoPan: false,
  })

  let closeTimer: ReturnType<typeof setTimeout> | undefined
  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = undefined
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer = setTimeout(() => marker.closePopup(), CLOSE_DELAY_MS)
  }

  marker.on('mouseover', () => {
    cancelClose()
    if (!marker.isPopupOpen()) {
      // Reset to "above" before opening so the flip check measures from a known
      // baseline (the popup element and its options persist across opens).
      const popup = marker.getPopup()
      if (popup) popup.options.offset = OFFSET_ABOVE
      marker.openPopup()
    }
  })
  marker.on('mouseout', scheduleClose)
  marker.on('popupopen', (event) => {
    const popup = event.popup
    const el = popup.getElement()
    if (!el) return

    // Flip below the marker when opening above would tuck the bubble under the
    // top filter panel. Measured against the panel's live bottom edge so it never
    // hides behind it. Reposition happens synchronously (before paint).
    el.classList.remove('appt-hover-popup--below')
    if (el.getBoundingClientRect().top < topSafeZone()) {
      popup.options.offset = [0, el.offsetHeight + FLIP_GAP_PX]
      el.classList.add('appt-hover-popup--below')
      popup.update()
    }

    const actionBtn = el.querySelector<HTMLButtonElement>(`.${actionClass}`)
    const handleAction = () => {
      marker.closePopup()
      onAction()
    }

    el.addEventListener('mouseenter', cancelClose)
    el.addEventListener('mouseleave', scheduleClose)
    actionBtn?.addEventListener('click', handleAction)

    marker.once('popupclose', () => {
      cancelClose()
      el.removeEventListener('mouseenter', cancelClose)
      el.removeEventListener('mouseleave', scheduleClose)
      actionBtn?.removeEventListener('click', handleAction)
    })
  })
}
