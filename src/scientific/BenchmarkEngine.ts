/**
 * Empirical Benchmarking Suite for Advanced Data Structures
 *
 * Runs browser-side performance tests across varying scales (N = 100 to 25,000):
 * 1. Fibonacci Heap vs Binary Heap (Insert, Decrease-Key, Extract-Min)
 * 2. Region QuadTree vs Brute-Force Linear Scan (Spatial Construction & Range Queries)
 */

import { FibonacciHeap } from '../ads/FibonacciHeap';
import { BinaryHeap } from '../ads/BinaryHeap';
import { QuadTree, Rectangle, PointItem } from '../ads/QuadTree';

export interface HeapBenchmarkDataPoint {
  n: number;
  fibInsertMs: number;
  binInsertMs: number;
  fibDecreaseKeyMs: number;
  binDecreaseKeyMs: number;
  fibExtractMinMs: number;
  binExtractMinMs: number;
  fibTotalMs: number;
  binTotalMs: number;
  theoreticalFibRatio: number; // Theoretical O(1) vs O(log N)
  theoreticalBinRatio: number;
}

export interface SpatialBenchmarkDataPoint {
  n: number;
  quadBuildMs: number;
  linearBuildMs: number;
  quadQueryMs: number;
  linearQueryMs: number;
  speedupFactor: number;
  theoreticalQuadRatio: number; // O(log N)
  theoreticalLinearRatio: number; // O(N)
}

export interface BenchmarkReport {
  timestamp: string;
  hardwareConcurrency: number;
  heapResults: HeapBenchmarkDataPoint[];
  spatialResults: SpatialBenchmarkDataPoint[];
  summary: {
    avgHeapSpeedup: number;
    avgSpatialSpeedup: number;
    maxNTested: number;
  };
}

export class BenchmarkEngine {
  /**
   * Benchmarks Fibonacci Heap vs Binary Heap across given sample sizes.
   */
  static runHeapBenchmark(
    sizes: number[] = [200, 1000, 3000, 8000, 15000, 25000],
    onProgress?: (currentN: number, totalN: number) => void
  ): HeapBenchmarkDataPoint[] {
    const results: HeapBenchmarkDataPoint[] = [];

    for (let idx = 0; idx < sizes.length; idx++) {
      const N = sizes[idx];
      if (onProgress) onProgress(idx + 1, sizes.length);

      // Generate randomized keys
      const keys: number[] = new Array(N);
      for (let i = 0; i < N; i++) {
        keys[i] = Math.random() * 10000;
      }

      // --- 1. FIBONACCI HEAP ---
      const fibHeap = new FibonacciHeap<number>();
      const fibNodes: any[] = [];

      // A. Insert
      const t0 = performance.now();
      for (let i = 0; i < N; i++) {
        fibNodes.push(fibHeap.insert(keys[i], i));
      }
      const t1 = performance.now();
      const fibInsertMs = t1 - t0;

      // B. Decrease-Key (50% of elements)
      const decreaseOps = Math.floor(N * 0.5);
      const t2 = performance.now();
      for (let i = 0; i < decreaseOps; i++) {
        const node = fibNodes[i * 2];
        const newKey = Math.max(0, node.key - 100 - Math.random() * 50);
        fibHeap.decreaseKey(node, newKey);
      }
      const t3 = performance.now();
      const fibDecreaseKeyMs = t3 - t2;

      // C. Extract-Min (25% of elements)
      const extractOps = Math.floor(N * 0.25);
      const t4 = performance.now();
      for (let i = 0; i < extractOps; i++) {
        fibHeap.extractMin();
      }
      const t5 = performance.now();
      const fibExtractMinMs = t5 - t4;

      const fibTotalMs = fibInsertMs + fibDecreaseKeyMs + fibExtractMinMs;

      // --- 2. BINARY HEAP ---
      const binHeap = new BinaryHeap<number>();
      const binIds: string[] = [];

      // A. Insert
      const bt0 = performance.now();
      for (let i = 0; i < N; i++) {
        binIds.push(binHeap.insert(keys[i], i));
      }
      const bt1 = performance.now();
      const binInsertMs = bt1 - bt0;

      // B. Decrease-Key (same 50% elements)
      const bt2 = performance.now();
      for (let i = 0; i < decreaseOps; i++) {
        const id = binIds[i * 2];
        // We know keys[i*2], decrease it
        const currentKey = keys[i * 2];
        const newKey = Math.max(0, currentKey - 100 - Math.random() * 50);
        binHeap.decreaseKey(id, newKey);
      }
      const bt3 = performance.now();
      const binDecreaseKeyMs = bt3 - bt2;

      // C. Extract-Min (same 25% elements)
      const bt4 = performance.now();
      for (let i = 0; i < extractOps; i++) {
        binHeap.extractMin();
      }
      const bt5 = performance.now();
      const binExtractMinMs = bt5 - bt4;

      const binTotalMs = binInsertMs + binDecreaseKeyMs + binExtractMinMs;

      results.push({
        n: N,
        fibInsertMs: parseFloat(fibInsertMs.toFixed(3)),
        binInsertMs: parseFloat(binInsertMs.toFixed(3)),
        fibDecreaseKeyMs: parseFloat(fibDecreaseKeyMs.toFixed(3)),
        binDecreaseKeyMs: parseFloat(binDecreaseKeyMs.toFixed(3)),
        fibExtractMinMs: parseFloat(fibExtractMinMs.toFixed(3)),
        binExtractMinMs: parseFloat(binExtractMinMs.toFixed(3)),
        fibTotalMs: parseFloat(fibTotalMs.toFixed(3)),
        binTotalMs: parseFloat(binTotalMs.toFixed(3)),
        theoreticalFibRatio: parseFloat((1 / Math.log2(N)).toFixed(4)),
        theoreticalBinRatio: 1.0,
      });
    }

    return results;
  }

  /**
   * Benchmarks Region QuadTree vs Brute-Force Linear Scan.
   */
  static runSpatialBenchmark(
    sizes: number[] = [200, 1000, 3000, 8000, 15000, 25000],
    onProgress?: (currentN: number, totalN: number) => void
  ): SpatialBenchmarkDataPoint[] {
    const results: SpatialBenchmarkDataPoint[] = [];
    const mapW = 4000;
    const mapH = 4000;

    for (let idx = 0; idx < sizes.length; idx++) {
      const N = sizes[idx];
      if (onProgress) onProgress(idx + 1, sizes.length);

      // Generate random spatial items
      const points: PointItem<number>[] = new Array(N);
      for (let i = 0; i < N; i++) {
        points[i] = {
          x: Math.random() * mapW,
          y: Math.random() * mapH,
          data: i,
        };
      }

      // Generate 200 random bounding-box range queries
      const queryCount = 200;
      const queryBoxes: Rectangle[] = new Array(queryCount);
      for (let i = 0; i < queryCount; i++) {
        const qx = Math.random() * (mapW - 300);
        const qy = Math.random() * (mapH - 300);
        queryBoxes[i] = new Rectangle(qx, qy, 300, 300);
      }

      // 1. QuadTree
      const qt0 = performance.now();
      const quadTree = new QuadTree<number>(new Rectangle(0, 0, mapW, mapH), 4);
      for (let i = 0; i < N; i++) {
        quadTree.insert(points[i]);
      }
      const qt1 = performance.now();
      const quadBuildMs = qt1 - qt0;

      const qt2 = performance.now();
      let quadMatches = 0;
      for (let i = 0; i < queryCount; i++) {
        const res = quadTree.queryRange(queryBoxes[i]);
        quadMatches += res.length;
      }
      const qt3 = performance.now();
      const quadQueryMs = qt3 - qt2;

      // 2. Linear Scan
      const lt0 = performance.now();
      const linearList = [...points];
      const lt1 = performance.now();
      const linearBuildMs = lt1 - lt0;

      const lt2 = performance.now();
      let linearMatches = 0;
      for (let i = 0; i < queryCount; i++) {
        const box = queryBoxes[i];
        for (let j = 0; j < linearList.length; j++) {
          if (box.contains(linearList[j])) {
            linearMatches++;
          }
        }
      }
      const lt3 = performance.now();
      const linearQueryMs = lt3 - lt2;

      const speedup = linearQueryMs > 0 ? linearQueryMs / Math.max(0.01, quadQueryMs) : 1;

      results.push({
        n: N,
        quadBuildMs: parseFloat(quadBuildMs.toFixed(3)),
        linearBuildMs: parseFloat(linearBuildMs.toFixed(3)),
        quadQueryMs: parseFloat(quadQueryMs.toFixed(3)),
        linearQueryMs: parseFloat(linearQueryMs.toFixed(3)),
        speedupFactor: parseFloat(speedup.toFixed(2)),
        theoreticalQuadRatio: parseFloat((Math.log2(N) / N).toFixed(5)),
        theoreticalLinearRatio: 1.0,
      });
    }

    return results;
  }
}
