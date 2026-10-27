import { expect, test } from "bun:test";
import { boothLayout, mapObstacles, visibleHallDecor, walkableSegment } from "./map-geometry.ts";

test("visible furniture footprints block their solid parts but leave chair margins walkable", () => {
  const obstacles = mapObstacles([{ x: 1, y: 0, width: 2, height: 2 }]);
  expect(obstacles.filter(({ kind }) => kind === "table")).toHaveLength(1);
  expect(obstacles.filter(({ kind }) => kind === "chair")).toHaveLength(2);
  expect(walkableSegment({ x: 3, y: 2.5 }, { x: 3, y: 2.9 }, obstacles)).toBe(false);
  expect(walkableSegment({ x: 0.65, y: 0.7 }, { x: 0.65, y: 1.2 }, obstacles)).toBe(true);
  expect(walkableSegment({ x: 1.5, y: 0.2 }, { x: 1.5, y: 0.65 }, obstacles)).toBe(false);
  expect(walkableSegment({ x: 3, y: 3 }, { x: 3, y: 2.75 }, obstacles)).toBe(true);
  expect(walkableSegment({ x: 0, y: 0 }, { x: -0.1, y: 0 }, obstacles)).toBe(false);
});

test("booth IDs choose stable furniture layouts with matching obstacles", () => {
  const footprint = { x: 1, y: 1, width: 3, height: 2 };
  const layouts = ["0", "1", "2"].map((booth) => boothLayout({ ...footprint, booth }));
  expect(layouts.map(({ variant }) => variant)).toEqual([0, 1, 2]);
  expect(layouts.map(({ furnishings }) => furnishings.map(({ kind }) => kind))).toEqual([
    ["chair", "table", "chair", "candle"], ["table", "chair", "shelf"],
    ["plant", "chair", "piano", "cabinet"],
  ]);
  for (const booth of ["0", "1", "2"]) {
    const layout = boothLayout({ ...footprint, booth });
    const obstacles = mapObstacles([{ ...footprint, booth }]);
    for (const furniture of layout.furnishings) {
      if (furniture.kind === "candle") continue; // The candle sits on an already solid table.
      const matching = obstacles.find((obstacle) => obstacle.kind === furniture.kind &&
        obstacle.x >= footprint.x - 0.5 + furniture.x &&
        obstacle.x <= footprint.x - 0.5 + furniture.x + furniture.width &&
        obstacle.y >= footprint.y - 0.5 + furniture.y &&
        obstacle.y <= footprint.y - 0.5 + furniture.y + furniture.height);
      expect(matching).toBeDefined();
    }
  }
});

test("hall furniture blocks walking until a booth replaces it", () => {
  expect(visibleHallDecor([]).map(({ kind }) => kind)).toEqual(["piano", "shelf"]);
  expect(mapObstacles([]).some(({ kind }) => kind === "cabinet")).toBe(false);
  expect(walkableSegment({ x: 7.5, y: 1.8 }, { x: 8.3, y: 1.8 }, mapObstacles([]))).toBe(false);
  const coveringBooth = { x: 7, y: 1, width: 2, height: 2 };
  expect(visibleHallDecor([coveringBooth]).some(({ kind }) => kind === "piano")).toBe(false);
  expect(mapObstacles([coveringBooth]).some(({ kind }) => kind === "piano")).toBe(false);
});
