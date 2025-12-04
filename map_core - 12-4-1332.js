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
  const el = document.getElementById("lockStatus");
  if (!el) return;

  // Per request: show constant centered phrase in the sticky bar
el.textContent = "Latitude Margaritaville Hilton Head";

}

// ------------------------
// Fetch season + password (web only)
// ------------------------
function fetchSeasonName() {
  fetch("season_name.txt")
    .then(function (r) { return r.text(); })
    .then(function (text) {
      const trimmed = text.trim();
      if (trimmed) currentSeasonName = trimmed;

      // We still load the season name for internal logic/popups,
      // but we keep the toggle label text as "Residents".
      updateSeasonToggleLabel();
    })
    .catch(function () {
      updateSeasonToggleLabel();
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
  // Always use the public GitHub Pages URL for the APK
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

  btn.addEventListener("click", function () {
    panel.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.add("hidden");
  });

  panel.addEventListener("click", function (e) {
    if (e.target === panel) panel.classList.add("hidden");
  });
}

// ------------------------
// Lot popup helpers
// (these use helpers from draw_lots.js: isSeasonStation, getSeasonDetails, shouldShowLot)
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

function showEventPopup(ev, clientX, clientY) {
  const popup = document.getElementById("lotPopup");
  if (!popup || !canvas || !mapWrapper) return;

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
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const cx = (clientX - rect.left) * scaleX;
  const cy = (clientY - rect.top)  * scaleY;

  // 1) Events
  const ev = findEventAt(cx, cy);
  if (ev) {
    showEventPopup(ev, clientX, clientY);
    return;
  }

  // 2) Lots
  const lot = findLotAt(cx, cy);
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
    // checked means switching to Residents (unlocked content)
    if (checkbox.checked) {
      if (!isUnlocked) {
        const entered = window.prompt("Enter password to view more details:");
        if (entered === PASSWORD) {
          isUnlocked = true;
          isSeasonOnly = false; // Residents
        } else {
          alert("Incorrect password. Staying in seasonal mode.");
          checkbox.checked = false; // back to Seasonal
          isSeasonOnly = true;
        }
      } else {
        isSeasonOnly = false; // Residents
      }
    } else {
      // unchecked means Seasonal mode
      isSeasonOnly = true;
    }

    updateLockStatusUI();
    updateSeasonToggleLabel();
    drawLots();
  });
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
	// make wrapper match the canvas so hit-testing stays aligned
  mapWrapper.style.width = canvas.width + "px";
  mapWrapper.style.height = canvas.height + "px";
	
    drawLots();
  };

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
  initMap();
});
