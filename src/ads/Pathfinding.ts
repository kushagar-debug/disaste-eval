/**
 * Dynamic A* Pathfinding with QuadTree-driven Hazard Risk Weighting
 *
 * Utilizes the first-principles FibonacciHeap for the open priority queue
 * and the Region QuadTree for spatial hazard risk queries.
 *
 * Cost Function:
 *   f(n) = g(n) + h(n)
 * where edge traversal cost c(u, v) = Haversine(u, v) * HazardPenalty(v).
 */

import { FibonacciHeap, FibonacciHeapNode } from './FibonacciHeap';
import { QuadTree, Point, haversineDistanceMeters } from './QuadTree';

export interface HazardZone {
  id: string;
  x: number; // Longitude
  y: number; // Latitude
  radius: number; // Radius in meters
  severity: number; // 1 to 10
  type: 'flood' | 'fire' | 'toxic' | 'seismic';
  maxRadius?: number; // Physical ceiling in meters
  initialRadius?: number; // Initial base radius
}

export interface PathNode {
  x: number; // Longitude
  y: number; // Latitude
}

export interface PathResult {
  path: PathNode[]; // Array of { x: lng, y: lat }
  totalDistance: number;
  accumulatedRisk: number;
  estimatedTransitTimeSec: number;
  minimumHazardClearance: number;
  nodesEvaluated: number;
}

export class DynamicPathfinder {
  private gridCols: number;
  private gridRows: number;
  private cellWidthLng: number;
  private cellHeightLat: number;

  constructor(
    public readonly minLng: number = 76.5400,
    public readonly minLat: number = 30.7500,
    public readonly maxLng: number = 76.6100,
    public readonly maxLat: number = 30.7900,
    resolution: number = 32 // Grid cells per dimension
  ) {
    this.gridCols = resolution;
    this.gridRows = resolution;
    this.cellWidthLng = (maxLng - minLng) / this.gridCols;
    this.cellHeightLat = (maxLat - minLat) / this.gridRows;
  }

  private coordToKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  private keyToCoord(key: string): { col: number; row: number } {
    const parts = key.split(',');
    return { col: parseInt(parts[0], 10), row: parseInt(parts[1], 10) };
  }

  private getPosition(col: number, row: number): Point {
    return {
      x: this.minLng + col * this.cellWidthLng + this.cellWidthLng / 2,
      y: this.minLat + row * this.cellHeightLat + this.cellHeightLat / 2,
    };
  }

  /**
   * Calculates terrain hazard penalty using the QuadTree spatial index.
   * If point is inside core lethal radius, returns Infinity (impassable).
   * Otherwise returns exponential decay penalty based on hazard proximity.
   */
  public evaluateHazardPenalty(
    point: Point,
    hazardQuadTree: QuadTree<HazardZone>
  ): { penalty: number; minDistance: number } {
    // Query hazards in a 3,500m threat radius
    const nearbyHazards = hazardQuadTree.queryGeoRadius(point.y, point.x, 3500);

    let multiplier = 1.0;
    let minDistance = Infinity;

    for (let i = 0; i < nearbyHazards.length; i++) {
      const hazard = nearbyHazards[i].data;
      const dist = haversineDistanceMeters(point.y, point.x, hazard.y, hazard.x);

      if (dist < minDistance) {
        minDistance = dist;
      }

      // Inside core lethal radius: completely blocked
      if (dist <= hazard.radius) {
        return { penalty: Infinity, minDistance: 0 };
      }

      // Proximity buffer: steep exponential danger decay
      const bufferDist = dist - hazard.radius;
      const threatFactor = (hazard.severity * 300) / Math.max(50, bufferDist);
      multiplier += threatFactor;
    }

    return { penalty: multiplier, minDistance };
  }

  /**
   * Dynamic A* Search from Start to Goal with Fibonacci Heap Open Set.
   * start: { x: lng, y: lat }, goal: { x: lng, y: lat }
   */
  public findOptimalEvacuationPath(
    start: Point,
    goal: Point,
    hazardQuadTree: QuadTree<HazardZone>
  ): PathResult | null {
    const startCol = Math.max(0, Math.min(this.gridCols - 1, Math.floor((start.x - this.minLng) / this.cellWidthLng)));
    const startRow = Math.max(0, Math.min(this.gridRows - 1, Math.floor((start.y - this.minLat) / this.cellHeightLat)));
    const goalCol = Math.max(0, Math.min(this.gridCols - 1, Math.floor((goal.x - this.minLng) / this.cellWidthLng)));
    const goalRow = Math.max(0, Math.min(this.gridRows - 1, Math.floor((goal.y - this.minLat) / this.cellHeightLat)));

    const startKey = this.coordToKey(startCol, startRow);
    const goalKey = this.coordToKey(goalCol, goalRow);

    const openSet = new FibonacciHeap<{ col: number; row: number; key: string }>();
    const nodeLookup = new Map<string, FibonacciHeapNode<{ col: number; row: number; key: string }>>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startKey, 0);

    const heuristic = (c: number, r: number): number => {
      const pos = this.getPosition(c, r);
      return haversineDistanceMeters(pos.y, pos.x, goal.y, goal.x);
    };

    const initialF = heuristic(startCol, startRow);
    fScore.set(startKey, initialF);
    const startNode = openSet.insert(initialF, { col: startCol, row: startRow, key: startKey });
    nodeLookup.set(startKey, startNode);

    const closedSet = new Set<string>();
    let evaluatedCount = 0;
    let minOverallHazardDistance = Infinity;

    // 8-directional neighbors (orthogonal + diagonal)
    const neighbors = [
      { dc: 0, dr: -1, cost: 1 },
      { dc: 0, dr: 1, cost: 1 },
      { dc: -1, dr: 0, cost: 1 },
      { dc: 1, dr: 0, cost: 1 },
      { dc: -1, dr: -1, cost: 1.414 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: 1, dr: 1, cost: 1.414 },
    ];

    while (!openSet.isEmpty()) {
      const current = openSet.extractMin();
      if (!current) break;

      evaluatedCount++;
      const currentData = current.value;
      const currentKey = currentData.key;
      nodeLookup.delete(currentKey);
      closedSet.add(currentKey);

      // Reached destination cell
      if (currentData.col === goalCol && currentData.row === goalRow) {
        // Reconstruct path
        const path: PathNode[] = [];
        let curr = currentKey;
        let totalDist = 0;
        let totalRisk = 0;

        path.push({ x: goal.x, y: goal.y });

        while (cameFrom.has(curr)) {
          const coord = this.keyToCoord(curr);
          const pos = this.getPosition(coord.col, coord.row);
          path.push(pos);
          const prev = cameFrom.get(curr)!;
          const prevCoord = this.keyToCoord(prev);
          const prevPos = this.getPosition(prevCoord.col, prevCoord.row);
          const segDist = haversineDistanceMeters(pos.y, pos.x, prevPos.y, prevPos.x);
          totalDist += segDist;

          const hEvaluation = this.evaluateHazardPenalty(pos, hazardQuadTree);
          totalRisk += (hEvaluation.penalty - 1.0) * (segDist / 100);
          if (hEvaluation.minDistance < minOverallHazardDistance) {
            minOverallHazardDistance = hEvaluation.minDistance;
          }

          curr = prev;
        }

        path.push({ x: start.x, y: start.y });
        path.reverse();

        // Transit speed: 20 km/h emergency ambulance transit = 5.5 m/s
        const baseSpeed = 5.5;
        const transitTime = (totalDist / baseSpeed) * (1 + totalRisk / (totalDist + 1));

        return {
          path,
          totalDistance: Math.round(totalDist),
          accumulatedRisk: parseFloat(totalRisk.toFixed(2)),
          estimatedTransitTimeSec: Math.round(transitTime),
          minimumHazardClearance: minOverallHazardDistance === Infinity ? 5000 : Math.round(minOverallHazardDistance),
          nodesEvaluated: evaluatedCount,
        };
      }

      // Explore neighbors
      for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        const nCol = currentData.col + n.dc;
        const nRow = currentData.row + n.dr;

        if (nCol < 0 || nCol >= this.gridCols || nRow < 0 || nRow >= this.gridRows) {
          continue;
        }

        const neighborKey = this.coordToKey(nCol, nRow);
        if (closedSet.has(neighborKey)) {
          continue;
        }

        const neighborPos = this.getPosition(nCol, nRow);
        const { penalty } = this.evaluateHazardPenalty(neighborPos, hazardQuadTree);

        if (penalty === Infinity) {
          continue; // Impassable
        }

        const stepDistance = n.cost * 800; // ~800m grid cell step
        const tentativeG = (gScore.get(currentKey) || 0) + stepDistance * penalty;

        if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, currentKey);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + heuristic(nCol, nRow);
          fScore.set(neighborKey, f);

          const existingNode = nodeLookup.get(neighborKey);
          if (existingNode) {
            if (f < existingNode.key) {
              openSet.decreaseKey(existingNode, f);
            }
          } else {
            const newNode = openSet.insert(f, { col: nCol, row: nRow, key: neighborKey });
            nodeLookup.set(neighborKey, newNode);
          }
        }
      }
    }

    return null;
  }
}
