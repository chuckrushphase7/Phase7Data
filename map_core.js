// map_core.js
// Core Phase 7 app logic: state, popups, map init, APK button.

let PASSWORD = "Rudolf122025";
let currentSeasonName = "Holiday Season";

let isSeasonOnly = true;
let isUnlocked = false;

let canvas, ctx, mapImg, mapWrapper;

// LOTS from phase7_merged_lots.js
const LOTS = (typeof phaseResidentsData !== "undefined") ? phaseResidentsData : [];

function upsertGator(id, x, y, size = 28) {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "alligator-sprite";
    el.textContent = "🐊";
    layer.appendChild(el);
  }

  el.style.left = x + "px";
  el.style.top  = y + "px";
  el.style.fontSize = size + "px";
}
function upsertSpriteImg(id, src, x, y, widthPx = 90) {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  let img = document.getElementById(id);
  if (!img) {
    img = document.createElement("img");
    img.id = id;
    img.className = "santa-sprite";
    img.alt = id;
    img.draggable = false;
    layer.appendChild(img);
  }

  img.src = src;
  img.style.left = x + "px";
  img.style.top  = y + "px";
  img.style.width = widthPx + "px";
}

function polygonCentroid(points) {
  // points: [[x,y], [x,y], ...]
  // Robust polygon centroid (area-weighted). Falls back to average if area is tiny.
  let area2 = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    area2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  if (Math.abs(area2) < 1e-6) {
    // Fallback: simple average
    let sx = 0, sy = 0;
    for (const [x, y] of points) { sx += x; sy += y; }
    return { x: sx / points.length, y: sy / points.length };
  }

  const area = area2 / 2;
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

function upsertSpriteImg(id, src, x, y, widthPx = 90) {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  let img = document.getElementById(id);
  if (!img) {
    img = document.createElement("img");
    img.id = id;
    img.className = "santa-sprite";
    img.alt = id;
    img.draggable = false;
    layer.appendChild(img);
  }

  img.src = src;
  img.style.left = x + "px";
  img.style.top  = y + "px";
  img.style.width = widthPx + "px";
}



function normalizeAlligator() {
  const g = document.getElementById("alligatorSprite");
  if (!g) return;

  // Make it bright and centered over its coordinate
  g.style.opacity = "1";
  g.style.filter = "none";
  g.style.transform = "translate(-50%, -50%)";
  g.style.textShadow = "0 0 3px #fff, 0 0 6px #fff";
}
function removeSantaSprites() {
  document.querySelectorAll(".santa-sprite").forEach(el => el.remove());
}

// ------------------------
// Season + lock UI
// ------------------------



function getSeasonIcon(name) {
  const lower = (name || "").toLowerCase();
  if (lower.indexOf("halloween") >= 0) return "🎃";
  if (lower.indexOf("christmas") >= 0) return "🎄";
  if (lower.indexOf("holiday") >= 0) return "🎉";
  if (lower.indexOf("light") >= 0) return "✨";
  if (lower.indexOf("spring") >= 0) return "🌸";
  if (lower.indexOf("summer") >= 0) return "☀️";
  if (lower.indexOf("fall") >= 0 || lower.indexOf("autumn") >= 0) return "🍂";
  return "⭐";
}

function updateSeasonToggleLabel() {
  const span = document.getElementById("seasonOnlyLabel");
  if (!span) return;
  // Per request: keep this label stable and simple
  span.textContent = "Residents";
}

function updateLockStatusUI() {
  // index.html currently hides #lockStatus by default (display:none).
  // Do NOT force text or display here; keep it stable/minimal.
  const el = document.getElementById("lockStatus");
  if (!el) return;
  // no-op on purpose
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
// APK label + download
// ------------------------
function updateApkButtonLabel() {
  if (typeof APK_LAST_UPDATED === "undefined") return;
  const btn = document.getElementById("apkDownloadButton");
  if (!btn) return;
  btn.textContent = "Download Android App (" + APK_LAST_UPDATED + ")";
}

function handleAndroidDownloadClick() {
  window.location.href = "https://chuckrushphase7.github.io/Phase7Data/Phase7Residents.apk";
}
window.handleAndroidDownloadClick = handleAndroidDownloadClick;

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
// Popup helpers
// ------------------------
function buildPopupContent(lot) {
  const seasonDetails = getSeasonDetails(lot);

  // Locked view
  if (!isUnlocked) {
    if (isSeasonStation(lot)) {
      return (
        '<div class="popup-inner">' +
        "<h3>" + currentSeasonName + " Station</h3>" +
        (seasonDetails ? "<p>" + seasonDetails + "</p>" : "") +
        '<button class="popup-close" onclick="hidePopup()">Close</button>' +
        "</div>"
      );
    }
    return (
      '<div class="popup-inner">' +
      "<h3>" + currentSeasonName + " Map</h3>" +
      '<button class="popup-close" onclick="hidePopup()">Close</button>' +
      "</div>"
    );
  }

  // Full details view
  const parts = [];
  parts.push("<h3>Lot " + lot.lotNumber + "</h3>");

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

  if (isSeasonStation(lot) && seasonDetails) {
    parts.push("<p><strong>" + currentSeasonName + " Station:</strong> " + seasonDetails + "</p>");
  }

  parts.push('<button class="popup-close" onclick="hidePopup()">Close</button>');
  return '<div class="popup-inner">' + parts.join("") + "</div>";
}

function hidePopup() {
  const popup = document.getElementById("lotPopup");
  if (popup) popup.classList.add("hidden");
}
window.hidePopup = hidePopup;

// Bottom-sheet popup: no left/top positioning (index.html uses position:fixed)
function showLotPopup(lot) {
  const popup = document.getElementById("lotPopup");
  if (!popup) return;
  popup.innerHTML = buildPopupContent(lot);
  popup.classList.remove("hidden");
}



function showEventPopup(ev) {
  const popup = document.getElementById("lotPopup");
  if (!popup) return;
  popup.innerHTML = buildEventPopupContent(ev);
  popup.classList.remove("hidden");
}



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
    if (!shouldShowLot(lot)) return;

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

  const xContent = xInWrap + mapWrapper.scrollLeft;
  const yContent = yInWrap + mapWrapper.scrollTop;

  // clamp to canvas bounds (prevents weird negatives / overscroll edges)
  const x = Math.max(0, Math.min(canvas.width  - 1, xContent));
  const y = Math.max(0, Math.min(canvas.height - 1, yContent));

  return { x, y };
}







// ✅ put it right here
function getScrollOffsets() {
  let el = mapWrapper;

  if (el && el.scrollWidth <= el.clientWidth && el.parentElement) {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const canScrollX = p.scrollWidth > p.clientWidth;
      const canScrollY = p.scrollHeight > p.clientHeight;
      if (canScrollX || canScrollY) { el = p; break; }
      p = p.parentElement;
    }
  }

  return {
    el,
    left: el ? el.scrollLeft : 0,
    top:  el ? el.scrollTop  : 0
  };
}



function handleCanvasTap(clientX, clientY) {
  const pt = getCanvasXYFromClient(clientX, clientY);

// console.log("POND COORD:", pt.x.toFixed(1), pt.y.toFixed(1));
// alert("tap " + pt.x.toFixed(1) + ", " + pt.y.toFixed(1));



  const ev = findEventAt(pt.x, pt.y);
  if (ev) { showEventPopup(ev); return; }

  const lot = findLotAt(pt.x, pt.y);
  if (lot) showLotPopup(lot);
  else hidePopup();
}








function setupCanvasEvents() {
  canvas.addEventListener("click", function (e) {

    handleCanvasTap(e.clientX, e.clientY);
  });

  canvas.addEventListener("touchend", function (e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      console.log("CANVAS TOUCH handler fired", t.clientX, t.clientY);
      handleCanvasTap(t.clientX, t.clientY);
    }
  });
}


// ------------------------
// Season-only toggle
// ------------------------
function setupSeasonToggle() {
  const checkbox = document.getElementById("seasonOnlyCheckbox");
  if (!checkbox) return;

  // Default: Seasonal (unchecked means seasonal, checked means residents)
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
    drawLots();
  });
}
function polygonCentroid(points) {
  let area2 = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    area2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(area2) < 1e-6) {
    let sx = 0, sy = 0;
    for (const [x, y] of points) { sx += x; sy += y; }
    return { x: sx / points.length, y: sy / points.length };
  }
  const area = area2 / 2;
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

function upsertSpriteImg(id, src, x, y, widthPx = 95) {
  const layer = document.getElementById("spriteLayer");
  if (!layer) return;

  let img = document.getElementById(id);
  if (!img) {
    img = document.createElement("img");
    img.id = id;
    img.className = "santa-sprite";
    img.alt = id;
    img.draggable = false;
    layer.appendChild(img);
  }

  img.src = src;
  img.style.left = x + "px";
  img.style.top  = y + "px";
  img.style.width = widthPx + "px";
}

// ------------------------
// Map init
// ------------------------
function initMap() {
  canvas = document.getElementById("mapCanvas");
  mapWrapper = document.getElementById("mapWrapper");
 


  if (!canvas || !mapWrapper) {
    console.error("Canvas or mapWrapper not found in DOM.");
    return;
  }

  ctx = canvas.getContext("2d");
  mapImg = new Image();
  mapImg.src = "Phase7Org.png";

 mapImg.onload = function () {
  console.log("Map image loaded:", mapImg.width, "x", mapImg.height);

  canvas.width  = mapImg.width;
  canvas.height = mapImg.height;
  const bg = MAPPED_SITES.find(s => s.siteId === "BlueGuitarPark" && s.phaseNumber === 7);
if (bg?.polygon) {
  const c = polygonCentroid(bg.polygon);
const isPhone = window.innerWidth < 600;
const santaW = isPhone ? 55 : 70;
const yOff   = isPhone ? 20 : 25;

upsertSpriteImg("santaBlueGuitar", "santa_sleigh.png", 770, 1158, santaW);





} else {
  console.warn("BlueGuitarPark not found in MAPPED_SITES.");
}




  // keep sprite overlay in the same coordinate space as canvas
  const layer = document.getElementById("spriteLayer");
  if (layer) {
    layer.style.width  = canvas.width + "px";
    layer.style.height = canvas.height + "px";
  }

  drawLots();

  // gators (add as many as you want)
  upsertGator("alligatorSprite1", 1129, 794, 28);
  upsertGator("alligatorSprite2", 617, 424, 28);
  upsertGator("alligatorSprite3", 345, 605, 28);
    upsertGator("alligatorSprite4",855 , 613, 28);
};

855
  mapImg.onerror = function (e) {
    console.error("FAILED to load map image Phase7Org.png", e);
  };

  setupCanvasEvents();
}

// ------------------------
// Startup
// ------------------------
window.addEventListener("load", function () {
  updateLockStatusUI();
  updateApkButtonLabel();

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
