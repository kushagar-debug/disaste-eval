/**
 * Binary Min-Heap - Array-based baseline implementation
 * Used for live empirical benchmarking against Fibonacci Heap.
 *
 * Characteristics:
 * - Insert: O(log N)
 * - ExtractMin: O(log N)
 * - DecreaseKey: O(log N) with index map
 * - FindMin: O(1)
 */

export interface BinaryHeapElement<T> {
  id: string;
  key: number;
  value: T;
}

export class BinaryHeap<T> {
  private heap: BinaryHeapElement<T>[] = [];
  private indexMap: Map<string, number> = new Map();

  public insertCount: number = 0;
  public extractMinCount: number = 0;
  public decreaseKeyCount: number = 0;

  constructor() {}

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(key: number, value: T, id?: string): string {
    const nodeId = id || `bh-${Math.random().toString(36).substring(2, 9)}`;
    const element: BinaryHeapElement<T> = { id: nodeId, key, value };
    this.heap.push(element);
    const index = this.heap.length - 1;
    this.indexMap.set(nodeId, index);
    this.siftUp(index);
    this.insertCount++;
    return nodeId;
  }

  findMin(): BinaryHeapElement<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  extractMin(): BinaryHeapElement<T> | null {
    if (this.heap.length === 0) return null;
    this.extractMinCount++;

    const min = this.heap[0];
    this.indexMap.delete(min.id);

    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.id, 0);
      this.siftDown(0);
    }

    return min;
  }

  decreaseKey(id: string, newKey: number): void {
    const index = this.indexMap.get(id);
    if (index === undefined) {
      throw new Error(`Node with id ${id} not found in BinaryHeap`);
    }

    if (newKey > this.heap[index].key) {
      throw new Error(`New key (${newKey}) cannot be greater than current key (${this.heap[index].key})`);
    }

    this.heap[index].key = newKey;
    this.decreaseKeyCount++;
    this.siftUp(index);
  }

  private siftUp(index: number): void {
    let curr = index;
    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2);
      if (this.heap[curr].key < this.heap[parent].key) {
        this.swap(curr, parent);
        curr = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let curr = index;
    const len = this.heap.length;

    while (true) {
      let smallest = curr;
      const left = 2 * curr + 1;
      const right = 2 * curr + 2;

      if (left < len && this.heap[left].key < this.heap[smallest].key) {
        smallest = left;
      }
      if (right < len && this.heap[right].key < this.heap[smallest].key) {
        smallest = right;
      }

      if (smallest !== curr) {
        this.swap(curr, smallest);
        curr = smallest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
    this.indexMap.set(this.heap[i].id, i);
    this.indexMap.set(this.heap[j].id, j);
  }

  clear(): void {
    this.heap = [];
    this.indexMap.clear();
    this.insertCount = 0;
    this.extractMinCount = 0;
    this.decreaseKeyCount = 0;
  }
}
