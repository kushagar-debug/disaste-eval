# DISASTE-EVAL
### High-Throughput Disaster Evaluation, Spatial Triage & Infrastructure Resilience Engine
#### Real-World Geospatial Calibration: Chandigarh University & Mamupur / Gharuan, Mohali (SAS Nagar), Punjab

[![Live Production](https://img.shields.io/badge/Live%20Deployment-disaste--eval--cu.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://disaste-eval-cu.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kushagar-debug/disaste-eval)
[![Research Paper](https://img.shields.io/badge/Research%20Paper-IEEE%20PDF-0369a1?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](./Disaster_Evaluation_ADS_Research_Paper.pdf)

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Sendai Aligned](https://img.shields.io/badge/UNDRR-Sendai%20Framework-0284c7)](https://www.undrr.org/implementing-sendai-framework/what-sendai-framework)

---

## Live Deployments & Artifacts

- **Live Production URL**: [https://disaste-eval-cu.vercel.app/](https://disaste-eval-cu.vercel.app/)
- **GitHub Repository**: [https://github.com/kushagar-debug/disaste-eval](https://github.com/kushagar-debug/disaste-eval)
- **Local Dev Server**: `http://localhost:5173/`
- **Formal Academic Research Paper**: [`Disaster_Evaluation_ADS_Research_Paper.pdf`](./Disaster_Evaluation_ADS_Research_Paper.pdf) (compiled via `npm run generate-pdf`)

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
│   └── PdfReportGenerator.ts # In-app research dossier export (.PDF)
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
scripts/
└── generate-report.js        # Standalone Node.js IEEE/ACM Research Paper PDF generator
```

---

## 2. Core Advanced Data Structures

### A. Geospatial Region QuadTree (`/src/ads/QuadTree.ts`)
- **WGS84 Space Partitioning**: Partitions geographic continuous space ($\text{lat}, \text{lng}$) into quadrants (`NW`, `NE`, `SW`, `SE`).
- **Haversine Spherical Range Queries**: Combines $\mathcal{O}(\log N)$ degree bounding-box pruning with great-circle spherical distance verification in meters ($R = 6,371,000\,\text{m}$).
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
- **Ackermann Inverse Efficiency**: Union by Rank and recursive Path Compression guarantee an amortized time of $\mathcal{O}(\alpha(V)) \approx \mathcal{O}(1)$ per operation.
- **Infrastructure Survivability**: Kruskal's algorithm drives the Dynamic Minimum Spanning Tree (MST), connecting critical medical facilities (Ivy Hospital, Kharar Civil Hospital), emergency shelters (CU Sports Arena, Academic Block Triage Base), and logistics depots. When arterial links (e.g., NH-5 bridges or rural access roads) collapse, the MST isolates partitioned components in real-time.

### D. Dynamic A* Pathfinding (`/src/ads/Pathfinding.ts`)
- **QuadTree Hazard Proximity Weighting**: Dynamic edge impedance function:
  $$\Psi(v) = 1.0 + \sum_{h \in \text{hazards}} \frac{\text{Severity}_h \times 300}{\max(50, \text{Haversine}(v, h) - \text{Radius}_h)}$$
- If a coordinate falls within the core lethal hazard perimeter, traversal cost is $\infty$ (impassable).

---

## 3. Mathematical & Sendai / NDMA Formulations

### 1. Disaster Risk Index (DRI)
Adheres to the **UNDRR Sendai Framework (Priority 1 & 4)** and **NDMA National Disaster Management Guidelines**:
$$R = \min\left(100, \max\left(0, \frac{\text{Hazard Threat} \times \text{Vulnerability Factor} \times 12}{\text{Capacity Margin}}\right)\right)$$
Where:
- $\text{Hazard Threat} \in [0.1, 10.0]$: Combines clinical hazard severity and physical expansion relative to hazard ceilings (`maxRadius`).
- $\text{Vulnerability Factor} \in [0.05, 3.0]$: Modulated by pediatric ($age < 12 \implies 1.4$) and geriatric ($age > 65 \implies 1.6$) vulnerability multipliers.
- $\text{Capacity Margin} \in [0.6, 5.0]$: Operational shelter absorption headroom based on total available shelter capacity relative to active casualty influx.

### 2. Dynamic Casualty Triage Score (DCTS)
$$\text{Priority Urgency} = (w_1 \cdot \text{Severity}) + (w_2 \cdot \text{Environmental Hazard}) + (w_3 \cdot \Delta t)$$
- $w_1 = 0.45$: Clinical vitals (Glasgow Coma Scale, shock index, hemorrhaging).
- $w_2 = 0.35$: QuadTree spatial hazard proximity (flood depth, toxic ppm, thermal front).
- $w_3 = 0.20$: Elapsed triage waiting time decay $\Delta t$.
- In the Fibonacci Min-Heap, highest urgency maps to the minimum key: $\text{Key} = \max(0.1, 100 - \text{Priority Urgency})$.

---

## 4. Workstation Features

- **Real-World Geospatial Map (Leaflet + Authenticated CartoDB Dark Matter)**:
  - Calibrated to **Chandigarh University campus & Mamupur / Gharuan, Mohali (SAS Nagar), Punjab** ($[30.7695^\circ\text{ N}, 76.5760^\circ\text{ E}]$).
  - Authenticated high-DPI Dark Matter tiles via CartoDB API.
  - Bounded hazard expansion with emergency shelter containment decay.
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
- **Dual PDF Dossier Engines**:
  - Browser-side publication-formatted PDF export via `jsPDF` + `jspdf-autotable`.
  - Standalone Node.js IEEE/ACM Research Paper compilation script (`scripts/generate-report.js`) compiling [`Disaster_Evaluation_ADS_Research_Paper.pdf`](./Disaster_Evaluation_ADS_Research_Paper.pdf).

---

## 5. Quickstart & Launch Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/kushagar-debug/disaste-eval.git
cd disaste-eval

# 2. Install dependencies
npm install

# 3. Launch development server
npm run dev
# Access at: http://localhost:5173/
```

### Production Build
```bash
# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

### Generate Academic Research Paper (PDF)
```bash
# Compiles Disaster_Evaluation_ADS_Research_Paper.pdf into project root
npm run generate-pdf
```

---

## 6. Live Production Access

The application is deployed continuously via Vercel:

- **Production URL**: [https://disaste-eval-cu.vercel.app/](https://disaste-eval-cu.vercel.app/)

---

## 7. Academic References
1. **Fredman, M. L., & Tarjan, R. E. (1987).** *Fibonacci heaps and their uses in improved network optimization algorithms.* Journal of the ACM (JACM), 34(3), 596-615.
2. **Finkel, R. A., & Bentley, J. L. (1974).** *Quad trees: A data structure for retrieval on composite keys.* Acta Informatica, 4(1), 1-9.
3. **Tarjan, R. E. (1975).** *Efficiency of a good but not linear set union algorithm.* Journal of the ACM (JACM), 22(2), 215-225.
4. **United Nations Office for Disaster Risk Reduction (UNDRR). (2015).** *Sendai Framework for Disaster Risk Reduction 2015-2030.*
5. **National Disaster Management Authority (NDMA). (2026).** *National Disaster Management Guidelines: Mass Casualty Events & Infrastructure Resilience Architecture.*
6. **Hart, P. E., Nilsson, N. J., & Raphael, B. (1968).** *A formal basis for the heuristic determination of minimum cost paths.* IEEE Transactions on Systems Science and Cybernetics, 4(2), 100-107.
