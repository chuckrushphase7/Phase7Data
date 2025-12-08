// event_engine.js
// Handles event visibility, icons, drawing, snow overlay, and event popups.
// Depends on globals defined elsewhere:
//   - EVENTS        (from events.js)
//   - LOTS          (from phase7_merged_lots.js / map_core.js)
//   - MAPPED_SITES  (from mapped_sites.js)
//   - currentSeasonName, isSeasonOnly (from map_core.js)
//   - canvas        (from map_core.js initMap)


function showSceneBannerFromEvent(ev) {
	console.log("showSceneBannerFromEvent CALLED", ev);


  const banner = document.getElementById("sceneBanner");
  const img = document.getElementById("sceneImg");
  const text = document.getElementById("sceneText");
  const snow = document.getElementById("sceneSnow"); // optional
console.log("BANNER ELs:", {
  banner: !!banner, img: !!img, text: !!text, snow: !!snow
});
  // Require only what we need to show the banner + image + text
  if (!banner || !img || !text) return;

  banner.classList.remove("hidden");
  banner.setAttribute("aria-hidden", "false");

  const title = (ev && (ev.label || ev.name)) || "Blue Guitar Park";
  const body =
    (ev && (ev.desc || ev.description || ev.body || ev.text)) ||
    "🎄 Merry Christmas from Blue Guitar Park!";

  text.innerHTML = `
    <div class="scene-title">${title}</div>
    <div class="scene-body">${body}</div>
  `;

  // --- helpers ---
  function forceSnowSizeSafe() {
    if (!snow) return;

    // use your existing function if present
    if (typeof forceSceneSnowCanvasSize === "function") {
      try { forceSceneSnowCanvasSize(); } catch (_) {}
      return;
    }

    // fallback size to .scene-media if present
    const media = document.querySelector("#sceneBanner .scene-media");
    if (!media) return;

    const r = media.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      snow.style.width = r.width + "px";
      snow.style.height = r.height + "px";
    }
  }

  function startSnowSafely() {
    if (!snow) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      forceSnowSizeSafe();
      if (typeof stopSceneSnow === "function") stopSceneSnow();
      if (typeof startSceneSnow === "function") startSceneSnow(snow);
    }));
  }

  function afterImageReady() {
    startSnowSafely();
    // WebView sometimes needs a second kick after layout settles
    setTimeout(startSnowSafely, 250);
  }

  // --- set image ---
  img.alt = title;

  // If your file is in /assets root, this is correct.
  // If it's in /assets/img/, change to "img/santa_sleigh.png"
  img.src = "santa_sleigh.png";

  // --- image ready pipeline (handles cached + WebView quirks) ---
  const maybeDecode = () => {
    if (img.decode) {
      img.decode().then(afterImageReady).catch(afterImageReady);
    } else {
      afterImageReady();
    }
  };

  if (img.complete && img.naturalWidth > 0) {
    maybeDecode();
  } else {
    img.onload = maybeDecode;
    img.onerror = () => {
      // image failed—still show banner; just skip image-dependent stuff
      afterImageReady();
    };
  }

  // Optional: bring banner into view
  try {
    banner.scrollIntoView({ block: "start", behavior: "smooth" });
  } catch (_) {}
}





  //banner.scrollIntoView({ block: "start", behavior: "smooth" });
    // WebView sometimes needs a second kick after layout settles
  //setTimeout(() => startSnowSafely(), 250);


function forceSceneSnowCanvasSize() {

  const media = document.querySelector("#sceneBanner .scene-media");
  if (!snow || !media) return;

  // Force CSS size to match the media box (WebView sometimes needs this)
  const r = media.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    snow.style.width = r.width + "px";
    snow.style.height = r.height + "px";
  }
}


function hideSceneBanner() {
  const banner = document.getElementById("sceneBanner");
  if (!banner) return;
  banner.classList.add("hidden");
  banner.setAttribute("aria-hidden", "true");
  if (typeof stopSceneSnow === "function") stopSceneSnow();
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "sceneCloseBtn") hideSceneBanner();
});



function getEventIcon(ev) {
  switch (ev.type) {
    case "santa":        return "🎅";
    case "mrs_claus":    return "🤶";
    case "sleigh":       return "🛷";
    case "photographer": return "📷";
    case "snow":         return "❄";
    case "alligator":    return "🐊";
    default:             return "⭐";
  }
}

function eventMatchesSeason(ev) {
  if (!ev.seasons || ev.seasons.length === 0) return true;
  const cur = (currentSeasonName || "").toLowerCase();
  return ev.seasons.some(s => (s || "").toLowerCase() === cur);
}

function isEventVisible(ev) {
  if (!ev.isActive) return false;
  if (!eventMatchesSeason(ev)) return false;
  if (isSeasonOnly && ev.requiresUnlock) return false;
  return true;
}

function getEventCoordinates(ev) {
  // 1) Lot-based event
  if (ev.lotNumber != null && Array.isArray(LOTS)) {
    const lot = LOTS.find(l => Number(l.lotNumber) === Number(ev.lotNumber));
    if (
      lot &&
      Number.isFinite(Number(l.x)) &&
      Number.isFinite(Number(l.y))
    ) {
      return {
        x: Number(l.x) + (ev.offsetX || 0),
        y: Number(l.y) + (ev.offsetY || 0)
      };
    }
  }

  // 2) Mapped site centroid
  if (ev.siteId && Array.isArray(MAPPED_SITES)) {
    const site = MAPPED_SITES.find(s => s.siteId === ev.siteId);
    if (site && Array.isArray(site.polygon) && site.polygon.length > 0) {
      let cx = 0;
      let cy = 0;
      site.polygon.forEach(p => {
        cx += p[0];
        cy += p[1];
      });
      cx /= site.polygon.length;
      cy /= site.polygon.length;
      return {
        x: cx + (ev.offsetX || 0),
        y: cy + (ev.offsetY || 0)
      };
    }
  }

  // 3) Explicit coordinates
  if (Number.isFinite(ev.x) && Number.isFinite(ev.y)) {
    return { x: ev.x, y: ev.y };
  }

  return null;
}

// ---------- animated gator sprite overlay ----------

function updateAlligatorSprite(pos) {
  const layer    = document.getElementById("spriteLayer");
  const canvasEl = document.getElementById("mapCanvas");
  if (!layer || !canvasEl) return;

  let sprite = document.getElementById("alligatorSprite");

  // No visible gator → remove sprite if it exists
  if (!pos) {
    if (sprite && sprite.parentNode) {
      sprite.parentNode.removeChild(sprite);
    }
    return;
  }

  // Create sprite if needed
  if (!sprite) {
    sprite = document.createElement("div");
    sprite.id = "alligatorSprite";
    sprite.className = "alligator-sprite";
    sprite.textContent = "🐊";
    layer.appendChild(sprite);
  }

  // Map from canvas coordinates → on-screen coordinates
  const rect   = canvasEl.getBoundingClientRect();
  const scaleX = rect.width  / canvasEl.width;
  const scaleY = rect.height / canvasEl.height;

  const screenX = pos.x * scaleX;
  const screenY = pos.y * scaleY;

  // Scale gator size with the map
  const baseSize = 28; // size when map is full 1500px wide
  const scale    = rect.width / canvasEl.width; // 0–1 on smaller screens
  const sizePx   = Math.max(16, baseSize * scale); // don't get too tiny

  sprite.style.fontSize = sizePx + "px";

  sprite.style.left = screenX + "px";
  sprite.style.top  = screenY + "px";
}


function drawEvents(ctx) {
  if (!Array.isArray(EVENTS)) return;

  let alligatorPos = null;

  EVENTS.forEach(ev => {
    if (!isEventVisible(ev)) return;

    // ❄ Snow overlay events: no icon, just background overlay
    if (ev.type === "snow" && ev.snowOverlay) return;

    const coords = getEventCoordinates(ev);
    if (!coords) return;

    const { x, y } = coords;
    const icon = getEventIcon(ev);

    // Remember gator position so we can place the sprite
    if (ev.type === "alligator") {
      alligatorPos = { x, y };
    }

    const haloRadius = 14;
    const dotRadius = 6;

    // Outer halo
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#f97316"; // orange highlight
    ctx.fill();

    // Icon above the dot (skip for gator: sprite handles it)
    ctx.font = "22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (ev.type !== "alligator") {
      ctx.fillText(icon, x, y - 20);
    }
  });

  // Place / remove animated gator sprite
  // updateAlligatorSprite(alligatorPos);
}

function shouldShowSnowOverlay() {
  if (!Array.isArray(EVENTS)) return false;
  return EVENTS.some(ev =>
    ev.type === "snow" &&
    ev.snowOverlay &&
    isEventVisible(ev)
  );
}

function drawSnowOverlay(ctx) {
  if (!shouldShowSnowOverlay()) return;
  if (!canvas) return;

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "rgba(255,255,255,0.9)";

  const stepX = canvas.width / 12;
  const stepY = canvas.height / 10;

  for (let x = stepX / 2; x < canvas.width; x += stepX) {
    for (let y = stepY / 2; y < canvas.height; y += stepY) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function findEventAt(x, y) {
  if (!Array.isArray(EVENTS)) return null;

  const threshold = 20;
  const thresholdSq = threshold * threshold;
  let bestEvent = null;
  let bestDistSq = thresholdSq;

  EVENTS.forEach(ev => {
    if (!isEventVisible(ev)) return;

    // ❄ Ignore snow overlay when hit-testing; we want Santa, not “Snow”
    if (ev.type === "snow" && ev.snowOverlay) return;

    const coords = getEventCoordinates(ev);
    if (!coords) return;

    const dx = x - coords.x;
    const dy = y - coords.y;
    const distSq = dx * dx + dy * dy;

    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      bestEvent = ev;
    }
  });

  return bestEvent;
}
function buildEventPopupContent(ev) {
  if (!ev) return "";

  var sid = ev.siteId ? String(ev.siteId) : "";
  var eid = ev.id ? String(ev.id) : "";

  // Special case: Blue Guitar Park -> sleigh scene
  if (sid === "BlueGuitarPark" || eid === "blue_guitar_scene") {
    var title = ev.label || "Blue Guitar Park";
    var body  = ev.desc || ev.description || ev.body || ev.text || "🎄 Merry Christmas from Blue Guitar Park!";

    return (
      '<div class="popup-inner">' +
        '<h3>' + title + '</h3>' +
        '<p>' + body + '</p>' +
        '<div style="margin-top:10px;">' +
          '<img src="santa_sleigh.png" alt="' + title + '" ' +
               'style="width:100%; max-width:520px; height:auto; border-radius:12px; display:block;">' +
        '</div>' +
      '</div>'
    );
  }

  // Normal event popup (generic)
  var title2 = ev.label || ev.name || ev.id || "Event";
  var body2  = ev.desc || ev.description || ev.body || ev.text || "";

  return (
    '<div class="popup-inner">' +
      '<h3>' + title2 + '</h3>' +
      (body2 ? '<p>' + body2 + '</p>' : '') +
    '</div>'
  );
}

// keep outside
window.buildEventPopupContent = buildEventPopupContent;

// Ensure drawEvents exists so draw_lots.js never dies (in case earlier code broke)
if (typeof window.drawEvents !== "function") {
  window.drawEvents = function drawEvents() { /* no-op fallback */ };
}

