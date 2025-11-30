// map_core.js
// Core Phase 7 app logic: state, popups, map init, APK button.

let PASSWORD = "Rudolf122025";
let currentSeasonName = "Holiday Season";

let isSeasonOnly = true;
let isUnlocked = false;

let canvas, ctx, mapImg, mapWrapper;

// LOTS from phase7_merged_lots.js
const LOTS = (typeof phaseResidentsData !== "undefined") ? phaseResidentsData : [];

// ------------------------
// Season + lock UI
// ------------------------
function updateSeasonToggleLabel() {
  const labelSpan = document.getElementById("seasonToggleLabel");
  if (!labelSpan) return;

  if (!isUnlocked) {
    labelSpan.textContent = "Locked View";
    return;
  }

  labelSpan.textContent = isSeasonOnly
    ? currentSeasonName + " Only"
    : "Full Resident Map";
}

function setSeasonOnly(value) {
  isSeasonOnly = !!value;
  updateSeasonToggleLabel();
  redrawMap();
}

function setupSeasonToggle() {
  const toggle = document.getElementById("seasonToggleCheckbox");
  if (!toggle) return;

  toggle.checked = isSeasonOnly;
  toggle.addEventListener("change", function () {
    setSeasonOnly(toggle.checked);
  });
}

function showPrivacyPanel() {
  const panel = document.querySelector(".privacy-panel");
  if (panel) {
    panel.classList.remove("hidden");
  }
}

function hidePrivacyPanel() {
  const panel = document.querySelector(".privacy-panel");
  if (panel) {
    panel.classList.add("hidden");
  }
}

function attemptUnlock() {
  const input = document.getElementById("unlockPasswordInput");
  if (!input) return;

  const entered = input.value.trim();
  if (!entered) {
    alert("Please enter a password.");
    return;
  }

  if (entered === PASSWORD) {
    isUnlocked = true;
    hidePrivacyPanel();
    updateSeasonToggleLabel();
    redrawMap();
  } else {
    alert("Incorrect password. Please try again.");
  }
}

function setupPrivacyPanel() {
  const unlockBtn = document.getElementById("unlockButton");
  const cancelBtn = document.getElementById("unlockCancel");

  if (unlockBtn) {
    unlockBtn.addEventListener("click", attemptUnlock);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", hidePrivacyPanel);
  }

  const privacyBadge = document.querySelector(".privacy-badge");
  if (privacyBadge) {
    privacyBadge.addEventListener("click", showPrivacyPanel);
  }
}

// ------------------------
// Season name + password fetch
// ------------------------
function fetchSeasonName() {
  fetch("season_name.txt")
    .then(function (r) { return r.text(); })
    .then(function (text) {
      const trimmed = text.trim();
      if (trimmed) currentSeasonName = trimmed;
      const seasonLabel = document.getElementById("currentSeasonName");
      if (seasonLabel) seasonLabel.textContent = currentSeasonName;
      updateSeasonToggleLabel();
    })
    .catch(function (err) {
      console.error("Failed to fetch season_name.txt", err);
    });
}

function fetchPassword() {
  fetch("phase7_password.txt")
    .then(function (r) { return r.text(); })
    .then(function (text) {
      const trimmed = text.trim();
      if (trimmed) PASSWORD = trimmed;
      console.log("Password loaded from file.");
    })
    .catch(function (err) {
      console.error("Failed to fetch phase7_password.txt", err);
    });
}

// ------------------------
// Filtering helpers
// ------------------------
function isSeasonStation(lotOrEvent) {
  return !!lotOrEvent && !!lotOrEvent.seasonStation;
}

function getSeasonDetails(lotOrEvent) {
  return lotOrEvent && lotOrEvent.seasonDetails
    ? lotOrEvent.seasonDetails
    : "";
}

// Determine if this lot should be shown for the current view state
function shouldShowLot(lot) {
  if (!lot) return false;

  // Hide entirely if flagged not visible
  if (lot.hideOnMap) return false;

  if (!isUnlocked) {
    // In locked mode:
    // - If "Season Only", only show season stations.
    // - If not, still show all lots for the map geometry.
    return isSeasonOnly ? isSeasonStation(lot) : true;
  }

  // Unlocked view:
  if (isSeasonOnly) {
    // Show only lots or events marked as season stations
    return isSeasonStation(lot);
  }

  // Full mode: show everything that's not explicitly hidden
  return true;
}

// ------------------------
// Map + drawing
// ------------------------
function loadMapImage(callback) {
  mapImg = new Image();
  mapImg.onload = callback;
  mapImg.src = "MapArt_Phase7-min.png";
}

function initCanvas() {
  canvas = document.getElementById("phase7Canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
}

function resizeCanvasToWrapper() {
  if (!canvas || !mapWrapper) return;

  const rect = mapWrapper.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// Fit the map image into the canvas, preserving aspect ratio
function drawMapBase() {
  if (!ctx || !mapImg) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imgAspect = mapImg.width / mapImg.height;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgAspect > canvasAspect) {
    // Image is wider relative to canvas
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspect;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    // Image is taller relative to canvas
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgAspect;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(mapImg, offsetX, offsetY, drawWidth, drawHeight);
}

// ------------------------
// Lot + event drawing
// ------------------------
function lotToCanvasCoords(lot) {
  if (!lot || !canvas || !mapImg) return null;

  const imgAspect = mapImg.width / mapImg.height;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgAspect > canvasAspect) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspect;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgAspect;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  }

  const nx = Number(lot.mapX || lot.x) / 1000;
  const ny = Number(lot.mapY || lot.y) / 1000;

  return {
    x: offsetX + nx * drawWidth,
    y: offsetY + ny * drawHeight
  };
}

function drawLots() {
  if (!ctx || !Array.isArray(LOTS)) return;

  LOTS.forEach(function (lot) {
    if (!shouldShowLot(lot)) return;

    const coords = lotToCanvasCoords(lot);
    if (!coords) return;

    const r = isSeasonStation(lot) ? 6 : 3;
    const color = isSeasonStation(lot) ? "#ff6600" : "#0080ff";

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function getSeasonIcon(name) {
  const lower = (name || "").toLowerCase();
  if (lower.indexOf("holiday") !== -1) return "🎄";
  if (lower.indexOf("halloween") !== -1) return "🎃";
  if (lower.indexOf("summer") !== -1) return "☀️";
  return "⭐";
}

function buildEventPopupContent(ev) {
  const parts = [];

  const title = ev.title || (currentSeasonName + " Station");
  const icon = getSeasonIcon(currentSeasonName);

  parts.push("<h3>" + icon + " " + title + "</h3>");

  if (ev.description) {
    parts.push("<p>" + ev.description + "</p>");
  }

  if (ev.host) {
    parts.push("<p><strong>Hosts:</strong> " + ev.host + "</p>");
  }

  if (ev.time) {
    parts.push("<p><strong>Time:</strong> " + ev.time + "</p>");
  }

  parts.push(
    '<button class="popup-close" onclick="hidePopup()">Close</button>'
  );

  return '<div class="popup-inner">' + parts.join("") + "</div>";
}

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

  var pName = lot.primaryName || "";
  var sName = lot.secondaryName || "";
  if (pName) {
    parts.push(
      "<p><strong>" +
      (sName ? (pName + " & " + sName) : pName) +
      "</strong></p>"
    );
  }

  if (lot.address) parts.push("<p>" + lot.address + "</p>");
  if (lot.homeTypeStyle) parts.push("<p>Home: " + lot.homeTypeStyle + "</p>");
  if (lot.contractStatus) parts.push("<p>Status: " + lot.contractStatus + "</p>");

  if (lot.isSensitive) {
    parts.push("<p><em>Details limited for privacy.</em></p>");
  } else {
    if (lot.originCityState) {
      parts.push("<p>From: " + lot.originCityState + "</p>");
    }
    if (lot.phone) {
      parts.push("<p>Phone: " + lot.phone + "</p>");
    }
    if (lot.notes) {
      parts.push("<p>Notes: " + lot.notes + "</p>");
    }
  }

  if (isSeasonStation(lot) && seasonDetails) {
    parts.push(
      "<p><strong>" + currentSeasonName +
      " Station:</strong> " + seasonDetails + "</p>"
    );
  }

  parts.push(
    '<button class="popup-close" onclick="hidePopup()">Close</button>'
  );

  return '<div class="popup-inner">' + parts.join("") + "</div>";
}

function hidePopup() {
  const popup = document.getElementById("lotPopup");
  if (popup) popup.classList.add("hidden");
}
window.hidePopup = hidePopup;

// ------------------------
// Hit testing + tap handling
// ------------------------
function findLotAt(x, y) {
  const threshold = 25;
  const thresholdSq = threshold * threshold;
  let best = null;
  let bestDist = thresholdSq;

  if (!Array.isArray(LOTS)) return null;

  LOTS.forEach(function (lot) {
    if (!shouldShowLot(lot)) return;

    const lx = Number(lot.x);
    const ly = Number(lot.y);
    if (isNaN(lx) || isNaN(ly)) return;

    const dx = lx - x;
    const dy = ly - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = lot;
    }
  });

  return best;
}

function showLotPopup(lot, clientX, clientY) {
  const popup = document.getElementById("lotPopup");
  if (!popup || !canvas || !mapWrapper) return;

  const wrapperRect = mapWrapper.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  popup.innerHTML = buildPopupContent(lot);
  popup.classList.remove("hidden");

  const offsetX = canvasRect.left - wrapperRect.left;
  const offsetY = canvasRect.top - wrapperRect.top;

  let left = (clientX - canvasRect.left) + offsetX + 12;
  let top  = (clientY - canvasRect.top)  + offsetY + 12;

  popup.style.left = left + "px";
  popup.style.top  = top  + "px";

  const popupRect = popup.getBoundingClientRect();

  if (window.innerWidth <= 768) {
    left = (wrapperRect.width - popupRect.width) / 2;
  }

  const maxLeft = wrapperRect.width - popupRect.width - 8;
  const maxTop  = wrapperRect.height - popupRect.height - 8;

  if (left < 8) left = 8;
  if (left > maxLeft) left = maxLeft;
  if (top < 8) top = 8;
  if (top > maxTop) top = maxTop;

  popup.style.left = left + "px";
  popup.style.top  = top  + "px";
}

function handleCanvasTap(clientX, clientY) {
  if (!canvas || !mapWrapper) return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const lot = findLotAt(x, y);

  if (lot) {
    showLotPopup(lot, clientX, clientY);
  } else {
    hidePopup();
  }
}

function setupCanvasEvents() {
  canvas.addEventListener("click", function (e) {
    handleCanvasTap(e.clientX, e.clientY);
  });

  canvas.addEventListener("touchend", function (e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      handleCanvasTap(t.clientX, t.clientY);
    }
  });
}

// ------------------------
// Redraw
// ------------------------
function redrawMap() {
  if (!canvas || !ctx) return;
  resizeCanvasToWrapper();
  drawMapBase();
  drawLots();
}

// ------------------------
// APK button + info
// ------------------------
function setupApkButton() {
  const apkButton = document.getElementById("apkButton");
  const apkInfoSpan = document.getElementById("apkInfo");

  if (!apkButton) return;

  apkButton.addEventListener("click", function () {
    window.open(
      "https://github.com/" +
        encodeURIComponent("chuckrushphase7") +
        "/" +
        encodeURIComponent("Phase7Data") +
        "/releases/download/v1.0.0/Phase7Residents.apk",
      "_blank"
    );
  });

  if (typeof apkInfo !== "undefined" && apkInfoSpan) {
    apkInfoSpan.textContent =
      "Build: " + apkInfo.buildDate + " (" + apkInfo.tag + ")";
  }
}

// ------------------------
// Init
// ------------------------
function initMap() {
  mapWrapper = document.querySelector(".map-wrapper");
  if (!mapWrapper) {
    console.error("No .map-wrapper found.");
    return;
  }

  initCanvas();
  if (!canvas) {
    console.error("No #phase7Canvas found.");
    return;
  }

  loadMapImage(function () {
    resizeCanvasToWrapper();
    drawMapBase();
    drawLots();
  });

  window.addEventListener("resize", redrawMap);
  setupCanvasEvents();
}

document.addEventListener("DOMContentLoaded", function () {
  const isWeb =
    window.location.protocol === "http:" ||
    window.location.protocol === "https:";

  if (isWeb) {
    fetchSeasonName();
    fetchPassword();
  } else {
    updateSeasonToggleLabel();
    console.warn("Running from file:// - skipping season/password fetch.");
  }

  setupPrivacyPanel();
  setupSeasonToggle();
  setupApkButton();
  initMap();
});
