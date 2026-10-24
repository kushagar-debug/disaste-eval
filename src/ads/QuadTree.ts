/**
 * Region QuadTree - First-Principles Implementation
 * Recursive 2D space partition supporting O(log N) bounding-box queries,
 * dynamic hazard radius lookups, and visual boundary extraction.
 *
 * Supports both Euclidean coordinates and Geospatial (WGS84 Lat/Lng) projections
 * with Haversine spherical distance calculations.
 *
 * Grounded in: Finkel, R. A., & Bentley, J. L. (1974). "Quad trees: A data structure for retrieval on composite keys."
 */

export interface Point {
  x: number; // In geo-mode: Longitude (East-West)
  y: number; // In geo-mode: Latitude (North-South)
}

export interface PointItem<T> extends Point {
  data: T;
}

export interface QuadBoundary {
  x: number; // minLng
  y: number; // minLat
  width: number; // deltaLng
  height: number; // deltaLat
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  depth: number;
  pointCount: number;
}

/**
 * Calculates Great-Circle distance in meters between two lat/lng coordinates (WGS84).
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class Rectangle {
  constructor(
    public readonly x: number, // In geo-mode: minLng
    public readonly y: number, // In geo-mode: minLat
    public readonly width: number,
    public readonly height: number
  ) {}

  get right(): number {
    return this.x + this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  contains(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.right &&
      point.y >= this.y &&
      point.y <= this.bottom
    );
  }

  intersects(range: Rectangle): boolean {
    return !(
      range.x > this.right ||
      range.right < this.x ||
      range.y > this.bottom ||
      range.bottom < this.y
    );
  }

  intersectsCircle(center: Point, radius: number): boolean {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(this.x, Math.min(center.x, this.right));
    const closestY = Math.max(this.y, Math.min(center.y, this.bottom));
    const dx = center.x - closestX;
    const dy = center.y - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }
}

export class QuadTree<T> {
  public points: PointItem<T>[] = [];
  public divided = false;
  public northwest: QuadTree<T> | null = null;
  public northeast: QuadTree<T> | null = null;
  public southwest: QuadTree<T> | null = null;
  public southeast: QuadTree<T> | null = null;

  constructor(
    public readonly boundary: Rectangle,
    public readonly capacity: number = 4,
    public readonly depth: number = 0,
    public readonly maxDepth: number = 10
  ) {}

  private subdivide(): void {
    const { x, y, width, height } = this.boundary;
    const halfW = width / 2;
    const halfH = height / 2;
    const nextDepth = this.depth + 1;

    // Subdivide into 4 quadrants
    this.northwest = new QuadTree<T>(
      new Rectangle(x, y + halfH, halfW, halfH),
      this.capacity,
      nextDepth,
      this.maxDepth
    );
    this.northeast = new QuadTree<T>(
      new Rectangle(x + halfW, y + halfH, halfW, halfH),
      this.capacity,
      nextDepth,
      this.maxDepth
    );
    this.southwest = new QuadTree<T>(
      new Rectangle(x, y, halfW, halfH),
      this.capacity,
      nextDepth,
      this.maxDepth
    );
    this.southeast = new QuadTree<T>(
      new Rectangle(x + halfW, y, halfW, halfH),
      this.capacity,
      nextDepth,
      this.maxDepth
    );

    this.divided = true;

    // Re-distribute existing points to children
    const existing = this.points;
    this.points = [];
    for (let i = 0; i < existing.length; i++) {
      this.insert(existing[i]);
    }
  }

  insert(point: PointItem<T>): boolean {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (!this.divided) {
      if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
        this.points.push(point);
        return true;
      }
      this.subdivide();
    }

    if (this.northwest!.insert(point)) return true;
    if (this.northeast!.insert(point)) return true;
    if (this.southwest!.insert(point)) return true;
    if (this.southeast!.insert(point)) return true;

    return false;
  }

  queryRange(range: Rectangle, found: PointItem<T>[] = []): PointItem<T>[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    for (let i = 0; i < this.points.length; i++) {
      if (range.contains(this.points[i])) {
        found.push(this.points[i]);
      }
    }

    if (this.divided) {
      this.northwest!.queryRange(range, found);
      this.northeast!.queryRange(range, found);
      this.southwest!.queryRange(range, found);
      this.southeast!.queryRange(range, found);
    }

    return found;
  }

  /**
   * Euclidean 2D radius query
   */
  queryRadius(center: Point, radius: number, found: PointItem<T>[] = []): PointItem<T>[] {
    if (!this.boundary.intersectsCircle(center, radius)) {
      return found;
    }

    const radiusSq = radius * radius;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      if (dx * dx + dy * dy <= radiusSq) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest!.queryRadius(center, radius, found);
      this.northeast!.queryRadius(center, radius, found);
      this.southwest!.queryRadius(center, radius, found);
      this.southeast!.queryRadius(center, radius, found);
    }

    return found;
  }

  /**
   * Real-World Geospatial Range Query (O(log N + K))
   * Uses QuadTree bounding-box pruning in degrees, followed by Haversine spherical verification.
   * centerLat: Latitude, centerLng: Longitude, radiusMeters: circle radius in meters
   */
  queryGeoRadius(
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): PointItem<T>[] {
    // 1 deg Lat ≈ 111,320m
    const deltaLat = radiusMeters / 111320;
    // 1 deg Lng ≈ 111,320m * cos(lat)
    const cosLat = Math.cos((centerLat * Math.PI) / 180);
    const deltaLng = radiusMeters / (111320 * Math.max(0.1, cosLat));

    // Bounding Box in degrees
    const geoBox = new Rectangle(
      centerLng - deltaLng,
      centerLat - deltaLat,
      deltaLng * 2,
      deltaLat * 2
    );

    // O(log N) bounding box query
    const candidates = this.queryRange(geoBox);

    // Exact Haversine sphere filter
    const matches: PointItem<T>[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      // p.x is Lng, p.y is Lat
      const distM = haversineDistanceMeters(centerLat, centerLng, p.y, p.x);
      if (distM <= radiusMeters) {
        matches.push(p);
      }
    }

    return matches;
  }

  getAllBoundaries(out: QuadBoundary[] = []): QuadBoundary[] {
    out.push({
      x: this.boundary.x,
      y: this.boundary.y,
      width: this.boundary.width,
      height: this.boundary.height,
      minLat: this.boundary.y,
      maxLat: this.boundary.bottom,
      minLng: this.boundary.x,
      maxLng: this.boundary.right,
      depth: this.depth,
      pointCount: this.points.length,
    });

    if (this.divided) {
      this.northwest!.getAllBoundaries(out);
      this.northeast!.getAllBoundaries(out);
      this.southwest!.getAllBoundaries(out);
      this.southeast!.getAllBoundaries(out);
    }

    return out;
  }

  size(): number {
    let count = this.points.length;
    if (this.divided) {
      count += this.northwest!.size();
      count += this.northeast!.size();
      count += this.southwest!.size();
      count += this.southeast!.size();
    }
    return count;
  }

  getMaxDepth(): number {
    if (!this.divided) return this.depth;
    return Math.max(
      this.northwest!.getMaxDepth(),
      this.northeast!.getMaxDepth(),
      this.southwest!.getMaxDepth(),
      this.southeast!.getMaxDepth()
    );
  }

  clear(): void {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
}
