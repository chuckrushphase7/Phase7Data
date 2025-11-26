// map_core.js
// Core Phase 7 app logic: global state, season/password, popups, init.

let PASSWORD = "Rudolf122025";
let currentSeasonName = "Holiday Season";

let isSeasonOnly = true;
let isUnlocked = false;

let canvas, ctx, mapImg, mapWrapper;

// LOTS from phase7_merged_lots.js
const LOTS = (typeof phaseResidentsData !== "undefined") ? phaseResidentsData : [];

// ----------------------------------------------------------
// Utility
// ----------------------------------------------------------
function getQueryParam(name) {
  if (!window.location || !window.location.search) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ----------------------------------------------------------
// APK Label + Download Handler
// ----------------------------------------------------------
function updateApkButtonLabel() {
  if (typeof APK_LAST_UPDATED === "undefined") return;

  const btn = document.getElementById("apkDownloadButton");
  if (!btn) return;

  btn.textContent = "Download Android App (" + APK_LAST_UPDATED + ")";
}

// Apply immediately on script load (Android WebView-safe)
updateApkButtonLabel();

function handleAndroidDownloadClick() {
  window.location.href = "Phase7Residents.apk";
}
window.handleAndroidDownloadClick = handleAndroidDownloadClick;

// ----------------------------------------------------------
// Season icon utilities
// ----------------------------------------------------------
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

function updateSeasonToggleLabel() {
  const labelSpan = document.getElementById("seasonOnlyLabel");
  if (!labelSpan) return;
  const icon = getSeasonIcon(currentSeasonName);
  labelSpan.textContent = icon + " " + currentSeasonName + " Only";
}

function updateLockStatusUI() {
  const lockStatus = document.getElementById("lockStatus");
  if (!lockStatus) return;

  if (!isUnlocked) {
    lockStatus.textContent = "Season view only (privacy mode)";
  } else {
    lockStatus.textContent = "Full map unlocked (session only)";
  }
}

// ----------------------------------------------------------
// Fetch season name + password (web only)
// ----------------------------------------------------------
function fetchSeasonName() {
  fetch("season_name.txt")
    .then(r => r.text())
    .then(text => {
      const trimmed = text.trim();
      if (trimmed) {
        currentSeasonName = trimmed;
      }
      updateSeasonToggleLabel();
    })
    .catch(() => {
      updateSeasonToggleLabel();
    });
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
      console.warn("Could not load phase7_password.txt, using default PASSWORD.", err);
    });
}

// ----------------------------------------------------------
// Privacy panel
// ----------------------------------------------------------
function setupPrivacyPanel() {
  const btn = document.getElementById("privacyButton");
  const panel = document.getElementById("privacyPanel");
  const closeBtn = document.getElementById("privacyCloseButton");

  if (!btn || !panel || !closeBtn) return;

  btn.addEventListener("click", () => panel.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

  panel.addEventListener("click", (e) => {
    if (e.target === panel) panel.classList.add("hidden");
  });
}

// ----------------------------------------------------------
// Lot popup builder
// ----------------------------------------------------------
function isSeasonStation(lot) {
  return !!lot.isChristmasStation;
}

function getSeasonDetails(lot) {
  return lot.christmasStationDetails || "";
}

function shouldShowLot(lot) {
  if (isSeasonOnly && !isSeasonStation(lot)) return false;
  return true;
}

function buildPopupContent(lot) {
  const seasonDetails = getSeasonDetails(lot);

  // Privacy mode
  if (!isUnlocked) {
    if (isSeasonStation(lot)) {
      return `
        <div class="popup-inner">
          <h3>${currentSeasonName} Station</h3>
          ${seasonDetails ? `<p>${seasonDetails}</p>` : ""}
          <button class="popup-close" onclick="hidePopup()">Close</button>
        </div>
      `;
    }
    return `
      <div class="popup-inner">
        <h3>${currentSeasonName} Map</h3>
        <button class="popup-close" onclick="hidePopup()">Close</button>
      </div>
    `;
  }

  // Full details
  const lines = [];

  lines.push(`<h3>Lot ${lot.lotNumber}</h3>`);

  const pName = lot.primaryName || "";
  const sName = lot.secondaryName || "";
  if (pName) {
    lines.push(`<p><strong>${sName ? `${pName} & ${sName}` : pName}</strong></p>`);
  }

  if (lot.address) lines.push(`<p>${lot.address}</p>`);
  if (lot.homeTypeStyle) lines.push(`<p>Home: ${lot.homeTypeStyle}</p>`);
  if (lot.contractStatus) lines.push(`<p>Status: ${lot.contractStatus}</p>`);

  if (lot.isSensitive) {
    lines.push(`<p><em>Details limited for privacy.</em></p>`);
  } else {
    if (lot.originCityState) lines.push(`<p>From: ${lot.originCityState}</p>`);
    if (lot.phone) lines.push(`<p>Phone: ${lot.phone}</p>`);
    if (lot.notes) lines.push(`<p>Notes: ${lot.notes}</p>`);
  }

  if (isSeasonStation(lot) && seasonDetails) {
    lines.push(`<p><strong>${currentSeasonName} Station:</strong> ${seasonDetails}</p>`);
  }

  lines.push(`<button class="popup-close" onclick="hidePopup()">Close</button>`);

  return `<div class="popup-inner">${lines.join("")}</div>`;
}

// ----------------------------------------------------------
// Popup display
// ----------------------------------------------------------
function showPopup(lot, cssX, cssY) {
  const popup = document.getElementById("lotPopup");
  if (!popup || !mapWrapper || !canvas) return;

  const wrapperRect = mapWrapper.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  popup.innerHTML = buildPopupContent(lot);
  popup.classList.remove("hidden");

  const offsetX = canvasRect.left - wrapperRect.left;
  const offsetY = canvasRect.top - wrapperRect.top;

  let left = cssX + offsetX + 12;
  let top  = cssY + offsetY + 12;

  popup.style.left = left + "px";
  popup.style.top  = top  + "px";

  const popupRect = popup.getBoundingClientRect();

  if (window.innerWidth <= 768) {
    left = (wrapperRect.width - popupRect.width) / 2;
  }

  const maxLeft = wrapperRect.width - popupRect.width - 8;
  const maxTop  = wrapperRect.height - popupRect.height - 8;

  left = Math.max(8, Math.min(left, maxLeft));
  top  = Math.max(8, Math.min(top, maxTop));

  popup.style.left = left + "px";
  popup.style.top  = top  + "px";
}

function hidePopup() {
  const popup = document.getElementById("lotPopup");
  if (popup) popup.classList.add("hidden");
}
window.hidePopup = hidePopup;

// ----------------------------------------------------------
// Hit testing
// ----------------------------------------------------------
function findLotAt(x, y) {
  const thresholdSq = 25 * 25;
  let best = null;
  let bestDist = thresholdSq;

  LOTS.forEach(lot => {
    if (!shouldShowLot(lot)) return;

    const lx = Number(lot.x);
    const ly = Number(lot.y);
    if (!Number.isFinite(lx) || !Number.isFinite(ly)) return;

    const dx = x - lx;
    const dy = y - ly;
    const d2 = dx*dx + dy*dy;

    if (d2 <= bestDist) {
      bestDist = d2;
      best = lot;
    }
  });

  return best;
}

// ----------------------------------------------------------
// Canvas events
// ----------------------------------------------------------
function handleCanvasTap(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const cx = (clientX - rect.left) * scaleX;
  const cy = (clientY - rect.top)  * scaleY;

  // Event hit
  const ev = findEventAt(cx, cy);
  if (ev) {
    showEventPopup(ev, clientX, clientY);
    return;
  }

  // Lot hit
  const lot = findLotAt(cx, cy);
  if (lot) {
    showPopup(lot, clientX - rect.left, clientY - rect.top);
  } else {
    hidePopup();
  }
}

function showEventPopup(ev, clientX, clientY) {
  const popup = document.getElementById("lotPopup");
  const wrapperRect = mapWrapper.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  popup.innerHTML = buildEventPopupContent(ev);
  popup.classList.remove("hidden");

  const offsetX = canvasRect.left - wrapperRect.left;
  const offsetY = canvasRect.top - wrapperRect.top;

  let left = (clientX - canvasRect.left) + offsetX + 12;
  let top  = (clientY - canvasRect.top)  + offsetY + 12;

  popup.style.left = left + "px";
  popup.style.top  = top  + "px";
}

function setupCanvasEvents() {
  canvas.addEventListener("click", (e) => {
    handleCanvasTap(e.clientX, e.clientY);
  });

  canvas.addEventListener("touchend", (e) => {
    if (e.changedTouches.length) {
      const t = e.changedTouches[0];
      handleCanvasTap(t.clientX, t.clientY);
    }
  });
}

// ----------------------------------------------------------
// Season-only toggle
// ----------------------------------------------------------
function setupSeasonToggle() {
  const checkbox = document.getElementById("seasonOnlyCheckbox");
  if (!checkbox) return;

  checkbox.addEventListener("change", () => {
    if (!isUnlocked && !checkbox.checked) {
      const entered = window.prompt("Enter password to unlock full map:");
      if (entered === PASSWORD) {
        isUnlocked = true;
        isSeasonOnly = false;
      } else {
        alert("Incorrect password. Staying in seasonal privacy mode.");
        checkbox.checked = true;
        isSeasonOnly = true;
      }
      updateLockStatusUI();
      drawLots();
      return;
    }

    isSeasonOnly = checkbox.checked;
    updateLockStatusUI();
    drawLots();
  });
}

// ----------------------------------------------------------
// Map initialization
// ----------------------------------------------------------
function initMap() {
  canvas = document.getElementById("mapCanvas");
  mapWrapper = document.getElementById("mapWrapper");

  if (!canvas || !mapWrapper) {
    console.error("Canvas or mapWrapper missing.");
    return;
  }

  ctx = canvas.getContext("2d");

  mapImg = new Image();
  mapImg.src = "Phase7Org.png";

  mapImg.onload = function () {
    console.log("Map image loaded:", mapImg.width, "x", mapImg.height);
    canvas.width  = mapImg.width;
    canvas.height = mapImg.height;
    drawLots();
  };

  mapImg.onerror = function (err) {
    console.error("FAILED to load Phase7Org.png", err);
  };

  setupCanvasEvents();
}

// ----------------------------------------------------------
// Admin Panel (if ?admin=1)
// ----------------------------------------------------------
function setupAdminPanel() {
  const adminFlag = getQueryParam("admin");
  const panel = document.getElementById("admin-panel");
  const summaryDiv = document.getElementById("admin-summary");
  const textarea = document.getElementById("admin-events-json");

  if (!panel || adminFlag !== "1") {
    if (panel) panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  let rowsHtml = "";
  let total = 0;
  let visible = 0;

  if (Array.isArray(window.EVENTS)) {
    total = EVENTS.length;
    visible = EVENTS.filter(ev => isEventVisible(ev)).length;

    rowsHtml += `
      <table style="width:100%; border-collapse: collapse; margin-top: 6px; font-size: 13px;">
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Label</th>
          <th>Location</th>
          <th>Season</th>
          <th>Visible?</th>
        </tr>
    `;

    EVENTS.forEach(ev => {
      const loc = ev.lotNumber
        ? "Lot " + ev.lotNumber
        : ev.siteId || "—";

      const seasons = ev.seasons?.length ? ev.seasons.join(", ") : "All";

      rowsHtml += `
        <tr>
          <td>${ev.id}</td>
          <td>${ev.type}</td>
          <td>${ev.label}</td>
          <td>${loc}</td>
          <td>${seasons}</td>
          <td>${isEventVisible(ev) ? "Yes" : "No"}</td>
        </tr>
      `;
    });

    rowsHtml += "</table>";
  }

  if (summaryDiv) {
    summaryDiv.innerHTML = `
      <p><strong>Events:</strong> ${visible} visible / ${total} total</p>
      ${rowsHtml}
    `;
  }

  if (textarea && Array.isArray(window.EVENTS)) {
    textarea.value = JSON.stringify(EVENTS, null, 2);
  }
}

// ----------------------------------------------------------
// Startup
// ----------------------------------------------------------
window.addEventListener("load", function () {
  updateLockStatusUI();
  updateApkButtonLabel();     // <-- critical for Android

  const isWeb =
    window.location.protocol === "http:" ||
    window.location.protocol === "https:";

  if (isWeb) {
    fetchSeasonName();
    fetchPassword();
  } else {
    updateSeasonToggleLabel();
    console.warn("Running from file:// — skipping season/password fetch.");
  }

  setupPrivacyPanel();
  setupSeasonToggle();
  initMap();

  if (typeof setupAdminPanel === "function") {
    setupAdminPanel();
  }
});
