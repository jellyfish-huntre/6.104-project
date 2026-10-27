export interface MapPoint { x: number; y: number }
export interface BoothFootprint extends MapPoint { width: number; height: number }
export interface BoothMapArea extends BoothFootprint { booth?: string }
export interface MapObstacle { x: number; y: number; width: number; height: number; kind: "plant" | "chair" | "table" | "piano" | "cabinet" | "shelf" }
export interface BoothFurnishing { x: number; y: number; width: number; height: number; kind: MapObstacle["kind"] | "candle" }

export const defaultMapExtent = { width: 10, height: 10 };
export const walkerRadius = 0.13;
export const plantCells = [{ x: 3, y: 3 }, { x: 6, y: 3 }, { x: 3, y: 6 }, { x: 6, y: 6 }];
export const hallDecor: MapObstacle[] = [
  { kind: "piano", x: 7.9, y: 1.4, width: 0.9, height: 0.9 },
  { kind: "shelf", x: 8.3, y: 4.1, width: 0.7, height: 0.7 },
];

export function visibleHallDecor(footprints: BoothMapArea[]) {
  return hallDecor.filter((item) => !footprints.some((footprint) =>
    item.x < footprint.x + footprint.width - 0.5 && item.x + item.width > footprint.x - 0.5 &&
    item.y < footprint.y + footprint.height - 0.5 && item.y + item.height > footprint.y - 0.5));
}

export function boothContains(footprint: BoothFootprint, position: MapPoint) {
  return position.x >= footprint.x - 0.5 && position.x < footprint.x + footprint.width - 0.5 &&
    position.y >= footprint.y - 0.5 && position.y < footprint.y + footprint.height - 0.5;
}

export function boothLayout(footprint: BoothMapArea) {
  let hash = 0;
  for (const character of footprint.booth ?? "") hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  const variant = footprint.booth ? hash % 3 : 0;
  if (footprint.width < 2 || footprint.height < 2) return { variant, furnishings: [] as BoothFurnishing[] };
  const width = footprint.width;
  const row = Math.floor(footprint.height * 0.65) + 0.2;
  const furnishings: BoothFurnishing[] = variant === 0 ? [
    { kind: "chair", x: width * 0.13, y: row, width: width * 0.16, height: 0.6 },
    { kind: "table", x: width * 0.31, y: row + 0.05, width: width * 0.38, height: 0.5 },
    { kind: "chair", x: width * 0.71, y: row, width: width * 0.16, height: 0.6 },
    { kind: "candle", x: width * 0.48, y: row + 0.12, width: 0.16, height: 0.24 },
  ] : variant === 1 ? [
    { kind: "table", x: width * 0.16, y: row + 0.05, width: width * 0.46, height: 0.5 },
    { kind: "chair", x: width * 0.68, y: row, width: width * 0.16, height: 0.6 },
    { kind: "shelf", x: width * 0.65, y: 0.25, width: 0.65, height: 0.65 },
  ] : [
    { kind: "plant", x: width * 0.13, y: 0.42, width: 0.42, height: 0.42 },
    { kind: "chair", x: width * 0.3, y: row, width: width * 0.16, height: 0.6 },
    { kind: "piano", x: width * 0.56, y: row - 0.15, width: 0.75, height: 0.75 },
    { kind: "cabinet", x: width * 0.68, y: 0.25, width: 0.6, height: 0.6 },
  ];
  return { variant, furnishings };
}

export function mapObstacles(footprints: BoothMapArea[]): MapObstacle[] {
  const obstacles: MapObstacle[] = visibleHallDecor(footprints);
  obstacles.push(...plantCells
    .filter((plant) => !footprints.some((footprint) => boothContains(footprint, plant)))
    // Only the pot/base occupies floor space; leaves may overlap a walker.
    .map(({ x, y }): MapObstacle => ({ x: x - 0.11, y: y - 0.04, width: 0.22, height: 0.22, kind: "plant" })));
  for (const footprint of footprints) {
    const left = footprint.x - 0.5;
    const top = footprint.y - 0.5;
    for (const furniture of boothLayout(footprint).furnishings) {
      if (furniture.kind === "chair") {
        // The Kenney chair has transparent margins inside its layout box.
        const chairSize = Math.min(furniture.width, furniture.height);
        obstacles.push({
          x: left + furniture.x + (furniture.width - chairSize) / 2 + chairSize * 3 / 16,
          y: top + furniture.y + (furniture.height - chairSize) / 2,
          width: chairSize * 10 / 16, height: chairSize, kind: "chair",
        });
      } else if (furniture.kind === "plant") {
        obstacles.push({
          x: left + furniture.x + (furniture.width - 0.22) / 2,
          y: top + furniture.y + furniture.height * 0.64,
          width: 0.22, height: 0.22, kind: "plant",
        });
      } else if (furniture.kind !== "candle") {
        obstacles.push({ x: left + furniture.x, y: top + furniture.y,
          width: furniture.width, height: furniture.height, kind: furniture.kind });
      }
    }
  }
  return obstacles;
}

function hitsObstacle(position: MapPoint, obstacle: MapObstacle) {
  if (obstacle.kind === "plant") {
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    return Math.hypot(position.x - centerX, position.y - centerY) < obstacle.width / 2 + walkerRadius;
  }
  const nearestX = Math.max(obstacle.x, Math.min(position.x, obstacle.x + obstacle.width));
  const nearestY = Math.max(obstacle.y, Math.min(position.y, obstacle.y + obstacle.height));
  return Math.hypot(position.x - nearestX, position.y - nearestY) < walkerRadius;
}

export function walkableSegment(from: MapPoint, to: MapPoint, obstacles: MapObstacle[],
  extent = defaultMapExtent) {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite) ||
    to.x < 0 || to.x > extent.width - 1 || to.y < 0 || to.y > extent.height - 1) return false;
  const activeObstacles = obstacles.filter((obstacle) => !hitsObstacle(from, obstacle));
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 0.04));
  for (let index = 1; index <= steps; index++) {
    const fraction = index / steps;
    const point = { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
    if (activeObstacles.some((obstacle) => hitsObstacle(point, obstacle))) return false;
  }
  return true;
}
