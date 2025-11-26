// draw_sites.js
// Handles drawing mapped parks & ponds using MAPPED_SITES from mapped_sites.js.

const DEBUG_POLYGONS = false;

function orderPolygonPoints(points) {
  if (!points || points.length < 3) return points;

  let cx = 0, cy = 0;
  for (const p of points) {
    cx += p[0];
    cy += p[1];
  }
  cx /= points.length;
  cy /= points.length;

  return points
    .map(p => ({
      x: p[0],
      y: p[1],
      angle: Math.atan2(p[1] - cy, p[0] - cx)
    }))
    .sort((a, b) => a.angle - b.angle)
    .map(p => [p.x, p.y]);
}

function debugPolygonVertices(ctx, points) {
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText(i.toString(), p[0] + 4, p[1] - 4);
  });
}

function drawPolygon(ctx, points, type) {
  if (!points || points.length < 3) return;

  const ordered = orderPolygonPoints(points);

  let stroke = "rgba(0,255,255,0.9)";
  let fill = "rgba(0,255,255,0.15)";

  if (type === "park") {
    stroke = "rgba(0,200,0,0.9)";
    fill = "rgba(0,200,0,0.15)";
  }

  ctx.beginPath();
  ctx.moveTo(ordered[0][0], ordered[0][1]);
  for (let i = 1; i < ordered.length; i++) {
    ctx.lineTo(ordered[i][0], ordered[i][1]);
  }
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;

  ctx.fill();
  ctx.stroke();

  if (DEBUG_POLYGONS) {
    debugPolygonVertices(ctx, ordered);
  }
}

function drawAllMappedSites(ctx) {
  if (typeof MAPPED_SITES === "undefined" || !Array.isArray(MAPPED_SITES)) return;
  MAPPED_SITES.forEach(site => {
    if (!site.polygon) return;
    drawPolygon(ctx, site.polygon, site.type);
  });
}
