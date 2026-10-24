/**
 * Fibonacci Heap - First-Principles Implementation
 *
 * Implements circular doubly linked lists, min-heap root list, lazy consolidation
 * with degree array, decrease-key with node marking and cascading-cut mechanics.
 * Guarantees O(1) amortized time for insert, findMin, and decreaseKey;
 * and O(log N) amortized time for extractMin and delete.
 *
 * Grounded in: Fredman, M. L., & Tarjan, R. E. (1987). "Fibonacci heaps and their
 * uses in improved network optimization algorithms." Journal of the ACM, 34(3), 596-615.
 */

export class FibonacciHeapNode<T> {
  public key: number;
  public value: T;
  public parent: FibonacciHeapNode<T> | null = null;
  public child: FibonacciHeapNode<T> | null = null;
  public prev: FibonacciHeapNode<T>;
  public next: FibonacciHeapNode<T>;
  public degree: number = 0;
  public isMarked: boolean = false;
  public readonly id: string;

  constructor(key: number, value: T, id?: string) {
    this.key = key;
    this.value = value;
    this.prev = this;
    this.next = this;
    this.id = id || `fhn-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export interface HeapRootSnapshot {
  id: string;
  key: number;
  degree: number;
  isMarked: boolean;
  childCount: number;
  children: HeapRootSnapshot[];
}

export class FibonacciHeap<T> {
  public minNode: FibonacciHeapNode<T> | null = null;
  public nodeCount: number = 0;

  // Real-time telemetry metrics for algorithmic evaluation
  public cascadingCutsCount: number = 0;
  public consolidationsCount: number = 0;
  public decreaseKeyCount: number = 0;
  public insertCount: number = 0;
  public extractMinCount: number = 0;

  constructor() {}

  isEmpty(): boolean {
    return this.minNode === null;
  }

  size(): number {
    return this.nodeCount;
  }

  /**
   * O(1) amortized and worst-case insertion.
   * Creates a singleton node and splices it into the root list.
   */
  insert(key: number, value: T, id?: string): FibonacciHeapNode<T> {
    const node = new FibonacciHeapNode<T>(key, value, id);

    if (this.minNode === null) {
      this.minNode = node;
    } else {
      this.spliceIntoRootList(node);
      if (node.key < this.minNode.key) {
        this.minNode = node;
      }
    }

    this.nodeCount++;
    this.insertCount++;
    return node;
  }

  /**
   * O(1) worst-case inspection of minimum key.
   */
  findMin(): FibonacciHeapNode<T> | null {
    return this.minNode;
  }

  /**
   * Splice node into the circular doubly-linked root list.
   */
  private spliceIntoRootList(node: FibonacciHeapNode<T>): void {
    if (this.minNode === null) {
      this.minNode = node;
      node.prev = node;
      node.next = node;
      return;
    }

    node.next = this.minNode.next;
    node.prev = this.minNode;
    this.minNode.next.prev = node;
    this.minNode.next = node;
  }

  /**
   * Removes a node from whatever circular doubly-linked list it resides in.
   */
  private removeFromList(node: FibonacciHeapNode<T>): void {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * O(log N) amortized extraction of minimum node.
   * Incorporates lazy consolidation with degree array linking.
   */
  extractMin(): FibonacciHeapNode<T> | null {
    const z = this.minNode;
    if (z === null) return null;

    this.extractMinCount++;

    // For each child of z, add to root list and set parent to null
    if (z.child !== null) {
      const children: FibonacciHeapNode<T>[] = [];
      let curr = z.child;
      do {
        children.push(curr);
        curr = curr.next;
      } while (curr !== z.child);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.parent = null;
        this.spliceIntoRootList(child);
      }
      z.child = null;
    }

    // Remove z from root list
    if (z.next === z) {
      this.minNode = null;
    } else {
      this.minNode = z.next;
      this.removeFromList(z);
      this.consolidate();
    }

    this.nodeCount--;
    return z;
  }

  /**
   * Consolidation: link roots of equal degree until no two roots have the same degree.
   * Degree upper bound: D(N) <= floor(log_phi(N)) + 1 <= 48 for N <= 10^9.
   */
  private consolidate(): void {
    this.consolidationsCount++;
    const maxDegree = 48;
    const array: (FibonacciHeapNode<T> | null)[] = new Array(maxDegree).fill(null);

    // Collect all current roots in root list
    const rootList: FibonacciHeapNode<T>[] = [];
    if (this.minNode !== null) {
      let curr = this.minNode;
      do {
        rootList.push(curr);
        curr = curr.next;
      } while (curr !== this.minNode);
    }

    for (let i = 0; i < rootList.length; i++) {
      let x = rootList[i];
      let d = x.degree;

      while (d < maxDegree && array[d] !== null) {
        let y = array[d]!;
        if (x.key > y.key) {
          const temp = x;
          x = y;
          y = temp;
        }
        this.link(y, x);
        array[d] = null;
        d++;
      }
      if (d < maxDegree) {
        array[d] = x;
      }
    }

    // Reconstruct root list from array and find new minNode
    this.minNode = null;
    for (let i = 0; i < maxDegree; i++) {
      const node = array[i];
      if (node !== null) {
        node.prev = node;
        node.next = node;
        node.parent = null;

        if (this.minNode === null) {
          this.minNode = node;
        } else {
          this.spliceIntoRootList(node);
          if (node.key < this.minNode.key) {
            this.minNode = node;
          }
        }
      }
    }
  }

  /**
   * Makes y a child of x.
   */
  private link(y: FibonacciHeapNode<T>, x: FibonacciHeapNode<T>): void {
    // Remove y from root list
    this.removeFromList(y);

    // Make y a child of x
    y.parent = x;
    if (x.child === null) {
      x.child = y;
      y.prev = y;
      y.next = y;
    } else {
      y.next = x.child.next;
      y.prev = x.child;
      x.child.next.prev = y;
      x.child.next = y;
    }

    x.degree++;
    y.isMarked = false;
  }

  /**
   * O(1) amortized decrease-key.
   * If heap invariant is violated, cuts node to root list and invokes cascading-cut.
   */
  decreaseKey(node: FibonacciHeapNode<T>, newKey: number): void {
    if (newKey > node.key) {
      throw new Error(`New key (${newKey}) cannot be greater than current key (${node.key})`);
    }

    node.key = newKey;
    this.decreaseKeyCount++;

    const parent = node.parent;
    if (parent !== null && node.key < parent.key) {
      this.cut(node, parent);
      this.cascadingCut(parent);
    }

    if (this.minNode === null || node.key < this.minNode.key) {
      this.minNode = node;
    }
  }

  /**
   * Cuts x from the child list of y and moves x to the root list.
   */
  private cut(x: FibonacciHeapNode<T>, y: FibonacciHeapNode<T>): void {
    // Remove x from y's child list
    if (x.next === x) {
      y.child = null;
    } else {
      if (y.child === x) {
        y.child = x.next;
      }
      this.removeFromList(x);
    }

    y.degree--;
    x.parent = null;
    x.isMarked = false;

    // Splice into root list
    this.spliceIntoRootList(x);
  }

  /**
   * Cascading cut: if parent y has already lost a child (marked), cut y from its parent
   * and recurse upwards; otherwise, mark y.
   */
  private cascadingCut(y: FibonacciHeapNode<T>): void {
    const z = y.parent;
    if (z !== null) {
      if (!y.isMarked) {
        y.isMarked = true;
      } else {
        this.cascadingCutsCount++;
        this.cut(y, z);
        this.cascadingCut(z);
      }
    }
  }

  /**
   * Delete node in O(log N) amortized time by decreasing key and extracting min.
   */
  delete(node: FibonacciHeapNode<T>): FibonacciHeapNode<T> | null {
    if (node === this.minNode) {
      return this.extractMin();
    }
    const currentMinKey = this.minNode ? this.minNode.key : 0;
    this.decreaseKey(node, currentMinKey - 1000);
    return this.extractMin();
  }

  clear(): void {
    this.minNode = null;
    this.nodeCount = 0;
    this.cascadingCutsCount = 0;
    this.consolidationsCount = 0;
    this.decreaseKeyCount = 0;
    this.insertCount = 0;
    this.extractMinCount = 0;
  }

  /**
   * Inspector snapshot to visualize root list trees and hierarchy in the HUD.
   */
  getRootTrees(): HeapRootSnapshot[] {
    const trees: HeapRootSnapshot[] = [];
    if (this.minNode === null) return trees;

    const buildSnapshot = (node: FibonacciHeapNode<T>): HeapRootSnapshot => {
      const childSnapshots: HeapRootSnapshot[] = [];
      if (node.child !== null) {
        let c = node.child;
        do {
          childSnapshots.push(buildSnapshot(c));
          c = c.next;
        } while (c !== node.child);
      }

      return {
        id: node.id,
        key: parseFloat(node.key.toFixed(2)),
        degree: node.degree,
        isMarked: node.isMarked,
        childCount: childSnapshots.length,
        children: childSnapshots,
      };
    };

    let curr = this.minNode;
    do {
      trees.push(buildSnapshot(curr));
      curr = curr.next;
    } while (curr !== this.minNode);

    return trees;
  }

  getTelemetry() {
    const rootTrees = this.getRootTrees();
    const degreeDistribution: Record<number, number> = {};
    let maxDegree = 0;
    for (const tree of rootTrees) {
      degreeDistribution[tree.degree] = (degreeDistribution[tree.degree] || 0) + 1;
      if (tree.degree > maxDegree) maxDegree = tree.degree;
    }

    return {
      nodeCount: this.nodeCount,
      minKey: this.minNode ? parseFloat(this.minNode.key.toFixed(2)) : null,
      cascadingCuts: this.cascadingCutsCount,
      consolidations: this.consolidationsCount,
      decreaseKeyOps: this.decreaseKeyCount,
      insertOps: this.insertCount,
      extractMinOps: this.extractMinCount,
      rootTreesCount: rootTrees.length,
      degreeDistribution,
      maxDegree,
    };
  }
}
