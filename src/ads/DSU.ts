/**
 * Disjoint-Set Union (DSU) & Dynamic Minimum Spanning Tree (MST)
 *
 * Implements Union by Rank and Path Compression to achieve an amortized
 * time complexity of O(α(N)) per operation, where α is the inverse Ackermann function.
 *
 * Powers dynamic infrastructure resilience tracking, detecting network partitioning
 * and calculating optimal survival connectivity trees under hazard collapses.
 *
 * Grounded in: Tarjan, R. E. (1975). "Efficiency of a Good But Not Linear Set Union Algorithm."
 * Journal of the ACM, 22(2), 215-225.
 */

export class DSU {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  private sizeMap: Map<string, number> = new Map();
  private setsCount: number = 0;

  constructor(elements: string[] = []) {
    for (const elem of elements) {
      this.makeSet(elem);
    }
  }

  makeSet(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      this.sizeMap.set(x, 1);
      this.setsCount++;
    }
  }

  /**
   * Find with full recursive Path Compression.
   * Flattens the tree so all visited nodes point directly to the root.
   */
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.makeSet(x);
      return x;
    }

    const p = this.parent.get(x)!;
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return p;
  }

  /**
   * Union by Rank: attach the smaller depth tree under the root of the deeper tree.
   */
  union(x: string, y: string): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Already in same set
    }

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;
    const sizeX = this.sizeMap.get(rootX) || 1;
    const sizeY = this.sizeMap.get(rootY) || 1;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
      this.sizeMap.set(rootY, sizeX + sizeY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
      this.sizeMap.set(rootX, sizeX + sizeY);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
      this.sizeMap.set(rootX, sizeX + sizeY);
    }

    this.setsCount--;
    return true;
  }

  connected(x: string, y: string): boolean {
    return this.find(x) === this.find(y);
  }

  getComponentSize(x: string): number {
    const root = this.find(x);
    return this.sizeMap.get(root) || 1;
  }

  getSetsCount(): number {
    return this.setsCount;
  }

  clear(): void {
    this.parent.clear();
    this.rank.clear();
    this.sizeMap.clear();
    this.setsCount = 0;
  }
}

export interface InfrastructureNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'shelter' | 'hospital' | 'depot' | 'telecom' | 'bridge';
  capacity: number;
  status: 'operational' | 'compromised' | 'offline';
}

export interface InfrastructureEdge {
  id: string;
  source: string;
  target: string;
  length: number;
  weight: number;
  status: 'active' | 'severed' | 'flooded' | 'damaged';
  hazardProximity: number;
}

export interface MSTResult {
  edges: InfrastructureEdge[];
  totalCost: number;
  connectedComponents: number;
  isolatedNodeCount: number;
  isFullyConnected: boolean;
}

export class DynamicMSTEngine {
  /**
   * Kruskal's Algorithm using First-Principles DSU
   * Computes the resilient minimum spanning tree across active infrastructure corridors.
   */
  static computeMST(
    nodes: InfrastructureNode[],
    edges: InfrastructureEdge[]
  ): MSTResult {
    const dsu = new DSU(nodes.map(n => n.id));
    const activeEdges = edges.filter(e => e.status === 'active');

    // Sort edges ascending by effective weight (distance + hazard penalty)
    const sortedEdges = [...activeEdges].sort((a, b) => a.weight - b.weight);

    const mstEdges: InfrastructureEdge[] = [];
    let totalCost = 0;

    for (let i = 0; i < sortedEdges.length; i++) {
      const edge = sortedEdges[i];
      if (dsu.union(edge.source, edge.target)) {
        mstEdges.push(edge);
        totalCost += edge.weight;
        if (mstEdges.length === nodes.length - 1) {
          break; // Connected all vertices
        }
      }
    }

    const componentMap = new Map<string, string[]>();
    for (const node of nodes) {
      const root = dsu.find(node.id);
      if (!componentMap.has(root)) {
        componentMap.set(root, []);
      }
      componentMap.get(root)!.push(node.id);
    }

    let isolated = 0;
    componentMap.forEach((members) => {
      if (members.length === 1) isolated++;
    });

    return {
      edges: mstEdges,
      totalCost,
      connectedComponents: componentMap.size,
      isolatedNodeCount: isolated,
      isFullyConnected: componentMap.size === 1 && nodes.length > 0,
    };
  }
}
