// draw_lots.js
// Draws lots and calls site + event rendering.

function isSeasonStation(lot) {
  return !!lot.isChristmasStation;
}

function getSeasonDetails(lot) {
  return lot.christmasStationDetails || "";
}

function shouldShowLot(lot) {
  if (isSeasonOnly && !isSeasonStation(lot)) {
    return false;
  }
  return true;
}

function drawLots() {
  if (!ctx || !mapImg) {
    console.warn("drawLots: missing ctx or mapImg", ctx, mapImg);
    return;
  }

  // Clear and draw base map
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);

  // 1) Parks & ponds
  drawAllMappedSites(ctx);

  const icon = getSeasonIcon(currentSeasonName);

  // 2) Lots
  if (Array.isArray(LOTS)) {
    LOTS.forEach(lot => {
      if (!shouldShowLot(lot)) return;

      const x = Number(lot.x);
      const y = Number(lot.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      const radius = 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (isSeasonStation(lot)) {
        ctx.fillStyle = "#2563eb"; // seasonal station
      } else {
        ctx.fillStyle = "#9ca3af"; // regular lot
      }

      ctx.fill();
      ctx.closePath();

      if (isSeasonStation(lot)) {
        ctx.font = "16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x, y - 14);
      }
    });
  }

  // 3) Events (Santa scene, alligator, etc.)
  drawEvents(ctx);

  // 4) Snow overlay
  drawSnowOverlay(ctx);
}
