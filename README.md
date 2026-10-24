# DISASTE-EVAL
### High-Throughput Disaster Evaluation, Spatial Triage & Infrastructure Resilience Engine
#### Real-World Geospatial GIS Calibration: Yamuna River Basin & Floodplains (Delhi NCR)

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Sendai Aligned](https://img.shields.io/badge/UNDRR-Sendai%20Framework-0284c7)](https://www.undrr.org/implementing-sendai-framework/what-sendai-framework)

---

## 1. System Overview & Philosophy

**DISASTE-EVAL** is an advanced geospatial systems architecture and algorithmic command workstation designed for high-density, real-time spatial evaluation, mass-casualty triage, and infrastructure connectivity under catastrophic multi-hazard events.

### Zero Third-Party ADS Philosophy
Every data structure in this engine is engineered **from first principles in TypeScript (`/src/ads/`)** with direct memory pointer manipulation and zero external abstract libraries:

```
src/
├── ads/
│   ├── QuadTree.ts           # Recursive 2D space partition with WGS84 Haversine range queries
│   ├── FibonacciHeap.ts      # Circular doubly-linked lists with cascading cuts & degree consolidation
│   ├── BinaryHeap.ts         # Array-based min-heap baseline for empirical benchmarks
│   ├── DSU.ts                # Disjoint-Set Union (Union by Rank + Path Compression) & MST
│   └── Pathfinding.ts        # Dynamic A* with QuadTree hazard-proximity weighting
├── scientific/
│   ├── RiskModel.ts          # UNDRR Sendai & NDMA Disaster Risk Formulation
│   ├── BenchmarkEngine.ts    # Browser-side comparative benchmarking (N = 100 to 25,000)
│   └── PdfReportGenerator.ts # Formal research dossier publication generator (.PDF)
├── components/
│   ├── map/
│   │   ├── GeospatialMap.tsx # Leaflet Map with CartoDB Dark Matter & live ADS overlays
│   │   └── MapLegendDrawer.tsx # Floating collapsible tactical legend drawer
│   ├── TelemetryHUD.tsx      # Real-time mathematical KPI cards & dynamic triage queue
│   ├── ADSInspectorPanel.tsx # Live root-forest tree inspector & QuadTree partition tables
│   ├── BenchmarkPanel.tsx    # Empirical latency profiling & Big-O theoretical curves
│   ├── TheoryPanel.tsx       # Mathematical formulations & interactive weight calibrator
│   └── Navbar.tsx            # Session control, scenario loader & PDF export
└── context/
    └── SimulationContext.tsx # Centralized cycle dispatcher & entity state machine
```

---

## 2. Core Advanced Data Structures

### A. Geospatial Region QuadTree (`/src/ads/QuadTree.ts`)
- **WGS84 Space Partitioning**: Partitions geographic continuous space ($\text{lat}, \text{lng}$) into quadrants (`NW`, `NE`, `SW`, `SE`).
- **Haversine Spherical Range Queries**: Combines $\mathcal{O}(\log N)$ degree bounding-box pruning with great-circle spherical distance verification in meters.
- **Visual Boundary Overlays**: Exports live bounding boxes (`[[minLat, minLng], [maxLat, maxLng]]`) rendered directly as glowing cyan rectangles on the Leaflet map.

### B. Fibonacci Heap with Degree Consolidation (`/src/ads/FibonacciHeap.ts`)
- **Node Anatomy**: Circular doubly linked lists (`prev`, `next`), pointer to `parent` and `child`, `degree`, and boolean `isMarked`.
- **Amortized Complexity**:
  - `insert(key, value)`: $\mathcal{O}(1)$
  - `findMin()`: $\mathcal{O}(1)$
  - `decreaseKey(node, newKey)`: $\mathcal{O}(1)$ amortized via cascading-cut mechanics.
  - `extractMin()`: $\mathcal{O}(\log N)$ amortized via degree-array consolidation.
- **Triage Dynamics**: Evacuating casualties triggers `extractMin()`, consolidating trees of identical degree into higher-order trees (Degree 1, Degree 2, Degree 3...), visible directly inside the ADS Inspector.

### C. Disjoint-Set Union & Dynamic MST (`/src/ads/DSU.ts`)
- **Ackermann Inverse Efficiency**: Union by Rank and recursive Path Compression guarantee an amortized time of $\mathcal{O}(\alpha(N)) \approx \mathcal{O}(1)$ per operation.
- **Infrastructure Survivability**: Kruskal's algorithm drives the Dynamic Minimum Spanning Tree (MST), connecting critical hospitals (AIIMS, LNJP, GTB) and relief muster hubs. When bridges across the Yamuna (e.g. Old Iron Bridge) flood, the MST isolates partitioned components in real-time.

### D. Dynamic A* Pathfinding (`/src/ads/Pathfinding.ts`)
- **QuadTree Hazard Proximity Weighting**: Dynamic edge impedance function:
  $$\Psi(v) = 1.0 + \sum_{h \in \text{hazards}} \frac{\text{Severity}_h \times 300}{\max(50, \text{Haversine}(v, h) - \text{Radius}_h)}$$
- If a coordinate falls within the core lethal hazard perimeter, traversal cost is $\infty$ (impassable).

---

## 3. Mathematical & Sendai / NDMA Formulations

### 1. Disaster Risk Index (DRI)
Adheres to the **UNDRR Sendai Framework (Priority 1 & 4)** and **NDMA National Disaster Management Guidelines**:
$$R = \frac{\text{Hazard Threat Level} \times \text{Vulnerability Factor}}{\text{Capacity Margin}}$$
Where:
- $\text{Hazard Threat} = \frac{1}{|H|} \sum_{h \in H} \text{Severity}_h \times \left(\frac{\text{Radius}_h}{500}\right)$
- $\text{Vulnerability Factor} V$ incorporates demographic age weighting ($\text{Pediatric} < 12$, $\text{Geriatric} > 65$) and environmental hazard exposure.
- $\text{Capacity Margin} C = \frac{\text{Active Shelter Beds} + \text{Medical Staff}}{1.5 \times \text{Active Casualties}}$

### 2. Dynamic Casualty Triage Score (DCTS)
$$\text{Priority Urgency} = (w_1 \cdot \text{Severity}) + (w_2 \cdot \text{Environmental Hazard}) + (w_3 \cdot \Delta t)$$
- $w_1 = 0.45$: Clinical vitals (Glasgow Coma Scale, shock index, hemorrhaging).
- $w_2 = 0.35$: QuadTree spatial hazard proximity (flood depth, toxic ppm, thermal front).
- $w_3 = 0.20$: Elapsed triage waiting time decay $\Delta t$.
- In the Fibonacci Min-Heap, highest urgency maps to the minimum key: $\text{Key} = \max(0.1, 100 - \text{Priority Urgency})$.

---

## 4. Workstation Features

- **Real-World Geospatial Map (Leaflet + CartoDB Dark Matter)**:
  - Calibrated to Yamuna River Basin & Floodplains (Delhi NCR).
  - Circular hazard zones (live meters radius) with pulse animations.
  - Dynamic MST infrastructure backbone drawn with live link impedances.
  - Directional A* evacuation corridors flowing toward nearest operational shelters.
  - Interactive tools: Add Casualties, Deploy Hazards, Establish Shelters, Sever Corridors.
- **Collapsible Tactical Legend Drawer**:
  - Mounted in bottom-left corner with START triage color codes, DSU MST line styles, hazard rings, and shelter badges.
- **ADS Structural Inspector**:
  - Post-consolidation degree distribution bar chart and circular root list forest visualizer.
  - Geospatial quadrant partition hierarchy table with depth metrics and point counts.
  - Kruskal MST edge breakdown and partition analysis.
- **Empirical Benchmarking Lab**:
  - In-browser profiling up to $N = 25,000$ operations.
  - Direct comparison of Fibonacci Heap vs Binary Heap and QuadTree vs Linear Scan.
  - Live latency bar charts and theoretical Big-O comparisons.
- **One-Click Formal Research Dossier Generator**:
  - Generates publication-formatted A4 PDF reports via `jsPDF` + `jspdf-autotable`.

---

## 5. Quickstart & Launch Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Launch Vite development server
npm run dev

# 3. Access in browser
open http://localhost:5173/
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 6. Academic References
1. **Fredman, M. L., & Tarjan, R. E. (1987).** *Fibonacci heaps and their uses in improved network optimization algorithms.* Journal of the ACM (JACM), 34(3), 596-615.
2. **Finkel, R. A., & Bentley, J. L. (1974).** *Quad trees: A data structure for retrieval on composite keys.* Acta Informatica, 4(1), 1-9.
3. **Tarjan, R. E. (1975).** *Efficiency of a good but not linear set union algorithm.* Journal of the ACM (JACM), 22(2), 215-225.
4. **United Nations Office for Disaster Risk Reduction (UNDRR). (2015).** *Sendai Framework for Disaster Risk Reduction 2015-2030.*
5. **National Disaster Management Authority (NDMA). (2019).** *National Disaster Management Guidelines: Mass Casualty Management.*
