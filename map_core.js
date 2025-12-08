// map_core.js
// Core Phase 7 app logic: state, popups/panel, map init, zoom, input handling.

let PASSWORD = "Rudolf122025";
let currentSeasonName = "Holiday Season";

let isSeasonOnly = true;
let isUnlocked = false;

let canvas, ctx, mapImg, mapWrapper;
let zoomScale = 1;

// LOTS from phase7_merged_lots.js
const LOTS = (typeof phaseResidentsData !== "undefined") ? phaseResidentsData : [];

// ------------------------
// Unified top info panel
// ------------------------
function hidePopup() {
  const panel = document.getElementById("infoPanel");
  const body  = document.getElementById("infoBody");
  if (!panel || !body) return;

  // Avoid hiding a focused element (Chrome warning)
  if (panel.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  body.innerHTML = "";
  panel.classList.add("hidden");
  panel.setAttribute("aria-hidden", "true");
}
window.hidePopup = hidePopup;


function showInfo(html) {
  const panel = document.getElementById("infoPanel");
  const body = document.getElementById("infoBody");
  if (!panel || !body) return;

  if (!html) { hidePopup(); return; }

  body.innerHTML = html;
  panel.classList.remove("hidden");
  panel.setAttribute("aria-hidden", "false");

  // keep it visible on phones
  try { panel.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (_) {}
}

// ------------------------
// Zoom
// ------------------------
function setZoom(scale) {
  zoomScale = Math.max(0.5, Math.min(2.5, scale));

  const c = document.getElementById("mapCanvas");
  if (!c || !c.width || !c.height) return;

  // scale canvas visually (canvas internal pixels stay original)
  c.style.width = (c.width * zoomScale) + "px";
  c.style.height = (c.height * zoomScale) + "px";

  // scale sprite layer to match visual canvas size
  const layer = document.getElementById("spriteLayer");
  if (layer) {
    layer.style.width = (c.width * zoomScale) + "px";
    layer.style.height = (c.height * zoomScale) + "px";
    layer.style.left = "0px";
    layer.style.top = "0px";
  }

  console.log("GATORS:", document.querySelectorAll(".alligator-sprite").length, "zoomScale=", zoomScale);
}

// ------------------------
// Sprites (gators)
// ------------------------
function upsertGator(id, x, y, size = 28, dx = 0, dy = 0) {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "alligator-sprite";
    el.innerHTML = `<span class="gator-emoji">🐊</span>`;
    layer.appendChild(el);
  }

  // position in *visual* pixels
  el.style.left = ((x + dx) * zoomScale) + "px";
  el.style.top = ((y + dy) * zoomScale) + "px";
  el.style.fontSize = (size * zoomScale) + "px";
}

function refreshGators() {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  // Clear and re-add expected gators (your final tuned positions)
  layer.querySelectorAll(".alligator-sprite").forEach(e => e.remove());

  // Your real gators (keep these exactly as you tuned)
  upsertGator("alligatorSprite1", 1129, 794, 28,  2, 12);
  upsertGator("alligatorSprite2",  617, 424, 28,  0,  0);
  upsertGator("alligatorSprite3",  345, 605, 28, 16,  0);
  upsertGator("alligatorSprite4",  855, 613, 28, -6,  0);
}

// ------------------------
// Season + lock UI
// ------------------------
function updateSeasonToggleLabel() {
  const span = document.getElementById("seasonOnlyLabel");
  if (!span) return;
  span.textContent = "Residents";
}

function updateLockStatusUI() {
  // Keep stable/minimal for now (header already has the title)
}

// ------------------------
// Fetch season + password (web only)
// ------------------------
function fetchSeasonName() {
  fetch("season_name.txt")
    .then(r => r.text())
    .then(text => {
      const trimmed = text.trim();
      if (trimmed) currentSeasonName = trimmed;
      updateSeasonToggleLabel();
    })
    .catch(() => updateSeasonToggleLabel());
}

function fetchPassword() {
  fetch("phase7_password.txt")
    .then(r => r.text())
    .then(text => {
      const trimmed = text.trim();
      if (trimmed) PASSWORD = trimmed;
      console.log("Password loaded from file.");
    })
    .catch(err => {
      console.warn("Could not load phase7_password.txt, using default.", err);
    });
}

// ------------------------
// APK label + download (optional)
// ------------------------
function updateApkButtonLabel() {
  // If you still use apk_info.js + label in index.html, you can leave this no-op.
  // index.html already populates #apkBuildLabel via apkInfo.
}

// ------------------------
// Privacy panel
// ------------------------
function setupPrivacyPanel() {
  const btn = document.getElementById("privacyButton");
  const panel = document.getElementById("privacyPanel");
  const closeBtn = document.getElementById("privacyCloseButton");
  if (!btn || !panel || !closeBtn) return;

  btn.addEventListener("click", () => panel.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.classList.add("hidden"); });
}

// ------------------------
// Popup content (lots)
// NOTE: uses your existing helper functions from other files:
// - isSeasonStation(lot)
// - getSeasonDetails(lot)
// - shouldShowLot(lot)
// ------------------------
function buildPopupContent(lot) {
  const seasonDetails = (typeof getSeasonDetails === "function") ? getSeasonDetails(lot) : "";

  // Locked view
  if (!isUnlocked) {
    if (typeof isSeasonStation === "function" && isSeasonStation(lot)) {
      return (
        '<div class="popup-inner">' +
          "<h3>" + currentSeasonName + " Station</h3>" +
          (seasonDetails ? "<p>" + seasonDetails + "</p>" : "") +
        "</div>"
      );
    }

    return (
      '<div class="popup-inner">' +
        "<h3>" + currentSeasonName + " Map</h3>" +
      "</div>"
    );
  }

  // Full details view
  const parts = [];
  parts.push("<h3>Lot " + (lot.lotNumber || "") + "</h3>");

  const pName = lot.primaryName || "";
  const sName = lot.secondaryName || "";
  if (pName) {
    parts.push("<p><strong>" + (sName ? (pName + " & " + sName) : pName) + "</strong></p>");
  }

  if (lot.address) parts.push("<p>" + lot.address + "</p>");
  if (lot.homeTypeStyle) parts.push("<p>Home: " + lot.homeTypeStyle + "</p>");
  if (lot.contractStatus) parts.push("<p>Status: " + lot.contractStatus + "</p>");

  if (lot.isSensitive) {
    parts.push("<p><em>Details limited for privacy.</em></p>");
  } else {
    if (lot.originCityState) parts.push("<p>From: " + lot.originCityState + "</p>");
    if (lot.phone) parts.push("<p>Phone: " + lot.phone + "</p>");
    if (lot.notes) parts.push("<p>Notes: " + lot.notes + "</p>");
  }

  if (typeof isSeasonStation === "function" && isSeasonStation(lot) && seasonDetails) {
    parts.push("<p><strong>" + currentSeasonName + " Station:</strong> " + seasonDetails + "</p>");
  }

  return '<div class="popup-inner">' + parts.join("") + "</div>";
}


// ------------------------
// Show lot / event in top panel
// ------------------------
function showLotPopup(lot) {
  const html = buildPopupContent(lot);
  showInfo(html);
}

function showEventPopup(ev) {
  console.log("EVENT CLICKED:", ev);

  // event_engine.js provides buildEventPopupContent(ev)
  if (typeof buildEventPopupContent !== "function") {
    console.warn("buildEventPopupContent not found");
    return;
  }

  const html = buildEventPopupContent(ev); // may return null for special cases
  showInfo(html);
}
window.showEventPopup = showEventPopup;

// ------------------------
// Hit testing + tap handling
// ------------------------
function findLotAt(x, y) {
  const threshold = 45;
  const thresholdSq = threshold * threshold;
  let best = null;
  let bestDist = thresholdSq;

  if (!Array.isArray(LOTS)) return null;

  LOTS.forEach(function (lot) {
    if (typeof shouldShowLot === "function" && !shouldShowLot(lot)) return;

    const lx = Number(lot.x);
    const ly = Number(lot.y);
    if (!Number.isFinite(lx) || !Number.isFinite(ly)) return;

    const dx = x - lx;
    const dy = y - ly;
    const d2 = dx * dx + dy * dy;

    if (d2 <= bestDist) {
      bestDist = d2;
      best = lot;
    }
  });

  return best;
}

/**
 * Convert viewport click/tap coords to ORIGINAL canvas pixel coords
 * while supporting scrolling inside #mapWrapper.
 */
function getCanvasXYFromClient(clientX, clientY) {
  const wrapRect = mapWrapper.getBoundingClientRect();

  const xInWrap = clientX - wrapRect.left;
  const yInWrap = clientY - wrapRect.top;

  // wrapper scroll is in the *unscaled content coordinates*, so undo zoom
  const xContent = (xInWrap + mapWrapper.scrollLeft) / zoomScale;
  const yContent = (yInWrap + mapWrapper.scrollTop) / zoomScale;

  return { x: xContent, y: yContent };
}

function handleCanvasTap(clientX, clientY) {
  const pt = getCanvasXYFromClient(clientX, clientY);

  // event_engine.js provides findEventAt(x,y)
  if (typeof findEventAt === "function") {
    const ev = findEventAt(pt.x, pt.y);
    if (ev) { showEventPopup(ev); return; }
  }

  const lot = findLotAt(pt.x, pt.y);
  if (lot) showLotPopup(lot);
  else hidePopup();
}

function setupCanvasEvents() {
  const target = document.getElementById("mapWrapper") || canvas;
  if (!target) return;

  target.addEventListener("click", function (e) {
    handleCanvasTap(e.clientX, e.clientY);
  });

  target.addEventListener("touchend", function (e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      handleCanvasTap(t.clientX, t.clientY);
    }
  }, { passive: true });
}
function getSeasonIcon(name) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("halloween")) return "🎃";
  if (lower.includes("christmas")) return "🎄";
  if (lower.includes("holiday")) return "🎉";
  if (lower.includes("light")) return "✨";
  if (lower.includes("spring")) return "🌸";
  if (lower.includes("summer")) return "☀️";
  if (lower.includes("fall") || lower.includes("autumn")) return "🍂";
  return "⭐";
}
window.getSeasonIcon = getSeasonIcon;

// ------------------------
// Season-only toggle
// ------------------------
function setupSeasonToggle() {
  const checkbox = document.getElementById("seasonOnlyCheckbox");
  if (!checkbox) return;

  checkbox.checked = false;
  isSeasonOnly = true;
  updateSeasonToggleLabel();

  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      if (!isUnlocked) {
        const entered = window.prompt("Enter password to view more details:");
        if (entered === PASSWORD) {
          isUnlocked = true;
          isSeasonOnly = false;
        } else {
          alert("Incorrect password. Staying in seasonal mode.");
          checkbox.checked = false;
          isSeasonOnly = true;
        }
      } else {
        isSeasonOnly = false;
      }
    } else {
      isSeasonOnly = true;
    }

    updateLockStatusUI();
    updateSeasonToggleLabel();

    if (typeof drawLots === "function") drawLots();
  });
}

// ------------------------
// Map init
// ------------------------
function initMap() {
  canvas = document.getElementById("mapCanvas");
  mapWrapper = document.getElementById("mapWrapper");
  if (!canvas || !mapWrapper) {
    console.error("Missing mapCanvas or mapWrapper");
    return;
  }

  ctx = canvas.getContext("2d");
  mapImg = new Image();

  mapImg.onload = function () {
    console.log("Map image loaded:", mapImg.width, "x", mapImg.height);

    // Golden rule: canvas stays in original pixel space
    canvas.width = mapImg.width;
    canvas.height = mapImg.height;

    // Default zoom: fit-to-screen on phones, normal on PC
    const isPhone = window.innerWidth < 700;
    if (isPhone) {
      const margin = 8;
      const wrapW = mapWrapper.clientWidth || mapWrapper.getBoundingClientRect().width;
      const wrapH = mapWrapper.clientHeight || mapWrapper.getBoundingClientRect().height;
      const fitW = (wrapW - margin) / canvas.width;
      const fitH = (wrapH - margin) / canvas.height;
      const fit = Math.min(fitW, fitH);
      setZoom(Math.max(0.15, Math.min(0.35, fit)));
    } else {
      setZoom(1);
    }

    // Draw + sprites
    if (typeof drawLots === "function") drawLots();
    refreshGators();

    setupCanvasEvents();
  };

  mapImg.onerror = function (e) {
    console.error("FAILED to load map image Phase7Org.png", e);
  };

  mapImg.src = "Phase7Org.png";
}

// ------------------------
// Startup
// ------------------------
window.addEventListener("load", function () {
  updateLockStatusUI();
  updateApkButtonLabel();

  // Close button for top panel
  document.getElementById("infoCloseBtn")?.addEventListener("click", hidePopup);

  const isWeb = (window.location.protocol === "http:" || window.location.protocol === "https:");

  if (isWeb) {
    fetchSeasonName();
    fetchPassword();
  } else {
    updateSeasonToggleLabel();
    console.warn("Running from file:// - skipping season/password fetch.");
  }

  setupPrivacyPanel();
  setupSeasonToggle();
  initMap();
});
