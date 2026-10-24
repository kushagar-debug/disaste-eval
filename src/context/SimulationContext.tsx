/**
 * Simulation State Management & Geospatial Scenario Presets
 *
 * Coordinates live simulation cycles, Geospatial QuadTree updates,
 * Fibonacci Heap priority queue maintenance, and DSU infrastructure MST recalculation.
 * Calibrated to Yamuna River Basin & Floodplains (Delhi / NCR).
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { QuadTree, Rectangle, haversineDistanceMeters } from '../ads/QuadTree';
import { FibonacciHeap, FibonacciHeapNode } from '../ads/FibonacciHeap';
import { DynamicMSTEngine, InfrastructureNode, InfrastructureEdge, MSTResult } from '../ads/DSU';
import { DynamicPathfinder, HazardZone, PathResult } from '../ads/Pathfinding';
import {
  Casualty,
  DisasterMetrics,
  ScientificRiskEngine,
  TriageCategory,
} from '../scientific/RiskModel';
import { HeapBenchmarkDataPoint, SpatialBenchmarkDataPoint } from '../scientific/BenchmarkEngine';

export type CanvasToolMode = 'inspect' | 'add_casualty' | 'add_hazard' | 'add_shelter' | 'sever_road';
export type ActiveTab = 'workstation' | 'inspector' | 'benchmark' | 'theory';

export interface SimulationContextType {
  // Navigation & Tool State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toolMode: CanvasToolMode;
  setToolMode: (mode: CanvasToolMode) => void;
  selectedHazardType: 'flood' | 'fire' | 'toxic' | 'seismic';
  setSelectedHazardType: (type: 'flood' | 'fire' | 'toxic' | 'seismic') => void;
  selectedCasualtyCategory: TriageCategory;
  setSelectedCasualtyCategory: (cat: TriageCategory) => void;

  // Simulation Controls
  isPlaying: boolean;
  togglePlay: () => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  tickCount: number;
  stepTick: () => void;
  currentScenario: string;
  loadScenario: (presetKey: string) => void;

  // View Overlays
  showQuadTreeOverlay: boolean;
  setShowQuadTreeOverlay: (val: boolean) => void;
  showMSTOverlay: boolean;
  setShowMSTOverlay: (val: boolean) => void;
  showEvacuationCorridors: boolean;
  setShowEvacuationCorridors: (val: boolean) => void;

  // Core Simulation Entities (Geo: x = Lng, y = Lat)
  hazards: HazardZone[];
  casualties: Casualty[];
  shelters: InfrastructureNode[];
  roads: InfrastructureEdge[];
  evacuationPaths: { casualtyId: string; result: PathResult; shelterId: string }[];

  // ADS Instances & Live Telemetry
  hazardQuadTree: QuadTree<HazardZone>;
  triageHeap: FibonacciHeap<Casualty>;
  mstResult: MSTResult;
  metrics: DisasterMetrics;
  heapTelemetry: any;

  // Selection & Inspector
  selectedEntity: { type: 'casualty' | 'hazard' | 'shelter' | 'road'; data: any } | null;
  setSelectedEntity: (entity: any) => void;

  // Manual Canvas / Map Actions (x: Lng, y: Lat)
  addCasualtyAt: (lng: number, lat: number, category?: TriageCategory) => void;
  addHazardAt: (lng: number, lat: number, type?: 'flood' | 'fire' | 'toxic' | 'seismic') => void;
  addShelterAt: (lng: number, lat: number) => void;
  toggleRoadStatus: (roadId: string) => void;
  evacuateCasualty: (casualtyId: string) => void;
  dispatchNextCritical: () => void;

  // Benchmarking Results Cache
  heapBenchmarks: HeapBenchmarkDataPoint[];
  setHeapBenchmarks: (data: HeapBenchmarkDataPoint[]) => void;
  spatialBenchmarks: SpatialBenchmarkDataPoint[];
  setSpatialBenchmarks: (data: SpatialBenchmarkDataPoint[]) => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

// Chandigarh University & Mamupur Mohali Geographic Bounds (WGS84)
const GEO_MIN_LNG = 76.5400;
const GEO_MAX_LNG = 76.6100;
const GEO_MIN_LAT = 30.7500;
const GEO_MAX_LAT = 30.7900;

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workstation');
  const [toolMode, setToolMode] = useState<CanvasToolMode>('inspect');
  const [selectedHazardType, setSelectedHazardType] = useState<'flood' | 'fire' | 'toxic' | 'seismic'>('flood');
  const [selectedCasualtyCategory, setSelectedCasualtyCategory] = useState<TriageCategory>('RED');

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [tickCount, setTickCount] = useState<number>(0);
  const [currentScenario, setCurrentScenario] = useState<string>('flood_catastrophe');

  const [showQuadTreeOverlay, setShowQuadTreeOverlay] = useState<boolean>(true);
  const [showMSTOverlay, setShowMSTOverlay] = useState<boolean>(true);
  const [showEvacuationCorridors, setShowEvacuationCorridors] = useState<boolean>(true);

  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Entities (x = Longitude, y = Latitude)
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [casualties, setCasualties] = useState<Casualty[]>([]);
  const [shelters, setShelters] = useState<InfrastructureNode[]>([]);
  const [roads, setRoads] = useState<InfrastructureEdge[]>([]);
  const [evacuationPaths, setEvacuationPaths] = useState<{ casualtyId: string; result: PathResult; shelterId: string }[]>([]);

  // First-Principles ADS instances
  const quadTreeRef = useRef<QuadTree<HazardZone>>(
    new QuadTree<HazardZone>(
      new Rectangle(GEO_MIN_LNG, GEO_MIN_LAT, GEO_MAX_LNG - GEO_MIN_LNG, GEO_MAX_LAT - GEO_MIN_LAT),
      4
    )
  );
  const triageHeapRef = useRef<FibonacciHeap<Casualty>>(new FibonacciHeap<Casualty>());
  const casualtyNodeMapRef = useRef<Map<string, FibonacciHeapNode<Casualty>>>(new Map());

  // Benchmarks Cache
  const [heapBenchmarks, setHeapBenchmarks] = useState<HeapBenchmarkDataPoint[]>([]);
  const [spatialBenchmarks, setSpatialBenchmarks] = useState<SpatialBenchmarkDataPoint[]>([]);

  // Telemetry States
  const [mstResult, setMstResult] = useState<MSTResult>({
    edges: [],
    totalCost: 0,
    connectedComponents: 1,
    isolatedNodeCount: 0,
    isFullyConnected: true,
  });

  const [metrics, setMetrics] = useState<DisasterMetrics>({
    disasterRiskIndex: 0,
    hazardThreatLevel: 0,
    vulnerabilityFactor: 1,
    capacityMargin: 1,
    sendaiPriorityCompliance: 100,
    communityFragilityIndex: 2.5,
    totalCasualties: 0,
    criticalRedCount: 0,
    yellowDelayedCount: 0,
    greenMinorCount: 0,
    blackExpectantCount: 0,
    evacuatedCount: 0,
    activeHazardsCount: 0,
    shelterOccupancyRate: 0,
  });

  const [heapTelemetry, setHeapTelemetry] = useState<any>({
    nodeCount: 0,
    minKey: null,
    cascadingCuts: 0,
    consolidations: 0,
    decreaseKeyOps: 0,
    insertOps: 0,
    extractMinOps: 0,
    rootTreesCount: 0,
    degreeDistribution: {},
    maxDegree: 0,
  });

  /**
   * Rebuilds Geospatial QuadTree from active hazards
   */
  const rebuildQuadTree = useCallback((currentHazards: HazardZone[]) => {
    const qt = new QuadTree<HazardZone>(
      new Rectangle(GEO_MIN_LNG, GEO_MIN_LAT, GEO_MAX_LNG - GEO_MIN_LNG, GEO_MAX_LAT - GEO_MIN_LAT),
      4
    );
    for (const h of currentHazards) {
      qt.insert({ x: h.x, y: h.y, data: h });
    }
    quadTreeRef.current = qt;
  }, []);

  /**
   * Recalculates Dynamic MST using DSU
   */
  const updateInfrastructureMST = useCallback((currentShelters: InfrastructureNode[], currentRoads: InfrastructureEdge[]) => {
    const mst = DynamicMSTEngine.computeMST(currentShelters, currentRoads);
    setMstResult(mst);
  }, []);

  /**
   * Re-evaluates casualty triage scores and executes decreaseKey() in Fibonacci Heap
   */
  const updateTriagePriorities = useCallback((
    currentCasualties: Casualty[],
    currentHazards: HazardZone[],
    qt: QuadTree<HazardZone>
  ) => {
    const heap = triageHeapRef.current;
    const nodeMap = casualtyNodeMapRef.current;

    const updatedCasualties = currentCasualties.map(c => {
      if (c.evacuated) return c;

      const environmentalExposure = ScientificRiskEngine.computeEnvironmentalExposure(
        { x: c.x, y: c.y },
        qt
      );

      const elapsedMinutes = Math.min(120, c.elapsedWaitMinutes + (0.2 * simSpeed));

      const { key: newHeapKey, rawUrgency } = ScientificRiskEngine.calculateCasualtyPriorityKey(
        c.severity,
        environmentalExposure,
        elapsedMinutes
      );

      const category = ScientificRiskEngine.evaluateTriageCategory(c.severity, rawUrgency);

      // Decrease key in O(1) amortized time
      const existingNode = nodeMap.get(c.id);
      if (existingNode) {
        if (newHeapKey < existingNode.key) {
          try {
            heap.decreaseKey(existingNode, newHeapKey);
          } catch (e) {
            // Handled
          }
        }
      } else {
        const newNode = heap.insert(newHeapKey, c, c.id);
        nodeMap.set(c.id, newNode);
      }

      return {
        ...c,
        elapsedWaitMinutes: elapsedMinutes,
        environmentalExposure,
        calculatedPriorityScore: newHeapKey,
        category,
      };
    });

    setCasualties(updatedCasualties);
    setHeapTelemetry(heap.getTelemetry());

    const updatedMetrics = ScientificRiskEngine.computeDisasterMetrics(
      updatedCasualties,
      currentHazards,
      shelters,
      qt
    );
    setMetrics(updatedMetrics);
  }, [shelters]);

  /**
   * Computes dynamic A* evacuation corridors
   */
  const recomputeEvacuationPaths = useCallback((
    activeCasualties: Casualty[],
    activeShelters: InfrastructureNode[],
    qt: QuadTree<HazardZone>
  ) => {
    if (activeShelters.length === 0) return;

    const pathfinder = new DynamicPathfinder(GEO_MIN_LNG, GEO_MIN_LAT, GEO_MAX_LNG, GEO_MAX_LAT, 28);
    const unevacuatedRed = activeCasualties
      .filter(c => !c.evacuated && (c.category === 'RED' || c.category === 'YELLOW'))
      .slice(0, 8);

    const paths: { casualtyId: string; result: PathResult; shelterId: string }[] = [];

    for (const casualty of unevacuatedRed) {
      let bestShelter = activeShelters[0];
      let bestDist = Infinity;

      for (const s of activeShelters) {
        if (s.status !== 'offline') {
          const d = haversineDistanceMeters(casualty.y, casualty.x, s.y, s.x);
          if (d < bestDist) {
            bestDist = d;
            bestShelter = s;
          }
        }
      }

      const pathRes = pathfinder.findOptimalEvacuationPath(
        { x: casualty.x, y: casualty.y },
        { x: bestShelter.x, y: bestShelter.y },
        qt
      );

      if (pathRes) {
        paths.push({
          casualtyId: casualty.id,
          result: pathRes,
          shelterId: bestShelter.id,
        });
      }
    }

    setEvacuationPaths(paths);
  }, []);

  /**
   * Loads Real-World Chandigarh University & Mamupur Mohali Disaster Scenarios
   */
  const loadScenario = useCallback((presetKey: string) => {
    setCurrentScenario(presetKey);
    triageHeapRef.current.clear();
    casualtyNodeMapRef.current.clear();

    if (presetKey === 'flood_catastrophe') {
      // Scenario: Monsoon Flash Flood & Cho Drainage Inundation (CU Campus - Mamupur Mohali)
      const initHazards: HazardZone[] = [
        { id: 'h1', x: 76.5835, y: 30.7680, radius: 480, initialRadius: 480, maxRadius: 2200, severity: 9.4, type: 'flood' }, // Mamupur Lowland Cho Overflow
        { id: 'h2', x: 76.5768, y: 30.7665, radius: 420, initialRadius: 420, maxRadius: 1800, severity: 8.7, type: 'flood' }, // CU South Hostels & Academic Compound
        { id: 'h3', x: 76.5610, y: 30.7735, radius: 520, initialRadius: 520, maxRadius: 2000, severity: 7.9, type: 'flood' }, // Gharuan Peripheral Agricultural Flood
        { id: 'h4', x: 76.5910, y: 30.7630, radius: 450, initialRadius: 450, maxRadius: 1900, severity: 8.2, type: 'flood' }, // NH-05 Drainage Swell & Canal Overflow
        { id: 'h5', x: 76.5735, y: 30.7720, radius: 320, initialRadius: 320, maxRadius: 1200, severity: 7.5, type: 'toxic' }, // CU Engineering Labs Hazardous Plume
      ];

      const initShelters: InfrastructureNode[] = [
        { id: 's1', name: 'CU Central Medical Centre & Health Dispensary', x: 76.5758, y: 30.7698, type: 'hospital', capacity: 250, status: 'operational' },
        { id: 's2', name: 'Gharuan Community Health Centre (CHC) Hub', x: 76.5580, y: 30.7730, type: 'hospital', capacity: 220, status: 'operational' },
        { id: 's3', name: 'Mamupur Community High School Relief Shelter', x: 76.5855, y: 30.7685, type: 'shelter', capacity: 190, status: 'operational' },
        { id: 's4', name: 'CU Main Auditorium & Indoor Sports Arena Hub', x: 76.5740, y: 30.7715, type: 'shelter', capacity: 360, status: 'operational' },
        { id: 's5', name: 'Mamupur - Kharar Highway Emergency Relief Depot', x: 76.5990, y: 30.7610, type: 'depot', capacity: 160, status: 'operational' },
        { id: 's6', name: 'Gharuan North Logistics Response Depot', x: 76.5520, y: 30.7790, type: 'depot', capacity: 140, status: 'operational' },
      ];

      // Realistic Arterial Corridors & Roadways
      const initRoads: InfrastructureEdge[] = [
        { id: 'r1', source: 's2', target: 's4', length: 1550, weight: 1550, status: 'active', hazardProximity: 0.15 }, // NH-05 West Gharuan to CU
        { id: 'r2', source: 's4', target: 's1', length: 420, weight: 420, status: 'active', hazardProximity: 0.2 },   // CU Main Campus Spine
        { id: 'r3', source: 's1', target: 's3', length: 940, weight: 940, status: 'active', hazardProximity: 0.25 },  // CU East Gate to Mamupur
        { id: 'r4', source: 's3', target: 's5', length: 1500, weight: 1500, status: 'active', hazardProximity: 0.2 },  // Mamupur to Highway Depot
        { id: 'r5', source: 's4', target: 's6', length: 2200, weight: 2200, status: 'active', hazardProximity: 0.2 },  // CU North to Gharuan Depot
        { id: 'r6', source: 's2', target: 's6', length: 900, weight: 900, status: 'active', hazardProximity: 0.1 },    // Gharuan Local Arterial
        { id: 'r7', source: 's1', target: 's5', length: 2100, weight: 2100, status: 'active', hazardProximity: 0.3 },  // South Perimeter Bypass
        { id: 'r8', source: 's1', target: 's3', length: 1100, weight: 16500, status: 'flooded', hazardProximity: 0.98 }, // South Hostel Direct Link (Severed by Cho Overflow!)
      ];

      // Populate realistic casualties across Chandigarh University campus & Mamupur village
      const names = [
        'Student Aarav S.', 'Resident Harpreet K.', 'Student Priya M.', 'Resident Gurpreet S.',
        'Student Simran B.', 'Elder Baldev S.', 'Worker Manpreet V.', 'Student Ananya D.',
        'Resident Jaswinder S.', 'Citizen Sunita R.', 'Student Vihaan T.', 'Worker Vikram J.'
      ];

      const initCasualties: Casualty[] = [];
      const qt = new QuadTree<HazardZone>(
        new Rectangle(GEO_MIN_LNG, GEO_MIN_LAT, GEO_MAX_LNG - GEO_MIN_LNG, GEO_MAX_LAT - GEO_MIN_LAT),
        4
      );
      for (const h of initHazards) qt.insert({ x: h.x, y: h.y, data: h });

      for (let i = 0; i < 34; i++) {
        // Disperse along Chandigarh University campus, Mamupur village, and Gharuan lowlands
        const lat = 30.7650 + Math.random() * 0.0090;
        const lng = 76.5680 + Math.random() * 0.0175 + (i % 2 === 0 ? 0.003 : 0);
        const severity = parseFloat((Math.random() > 0.4 ? 5.5 + Math.random() * 4.3 : 1.5 + Math.random() * 3.5).toFixed(1));
        const age = Math.floor(18 + Math.random() * 52);

        const exp = ScientificRiskEngine.computeEnvironmentalExposure({ x: lng, y: lat }, qt);
        const { key, rawUrgency } = ScientificRiskEngine.calculateCasualtyPriorityKey(severity, exp, Math.random() * 25);
        const cat = ScientificRiskEngine.evaluateTriageCategory(severity, rawUrgency);

        const cas: Casualty = {
          id: `cas-${i + 1}`,
          name: `${names[i % names.length]} #${100 + i}`,
          x: lng,
          y: lat,
          severity,
          age,
          category: cat,
          registeredAt: Date.now() - Math.floor(Math.random() * 3600000),
          elapsedWaitMinutes: Math.floor(Math.random() * 20),
          environmentalExposure: exp,
          calculatedPriorityScore: key,
          evacuated: false,
        };

        initCasualties.push(cas);
        const node = triageHeapRef.current.insert(key, cas, cas.id);
        casualtyNodeMapRef.current.set(cas.id, node);
      }

      setHazards(initHazards);
      setShelters(initShelters);
      setRoads(initRoads);
      setCasualties(initCasualties);
      rebuildQuadTree(initHazards);
      updateInfrastructureMST(initShelters, initRoads);
      recomputeEvacuationPaths(initCasualties, initShelters, qt);
    } else {
      // Scenario: NH-05 Hazardous Materials Rupture & Campus Alert (CU - Mamupur)
      const initHazards: HazardZone[] = [
        { id: 'h1', x: 76.5810, y: 30.7675, radius: 460, initialRadius: 460, maxRadius: 1500, severity: 9.6, type: 'toxic' }, // NH-05 Mamupur Junction Chemical Tanker Rupture
        { id: 'h2', x: 76.5760, y: 30.7655, radius: 380, initialRadius: 380, maxRadius: 1100, severity: 8.8, type: 'fire' },  // CU South Commercial Strip Fire
        { id: 'h3', x: 76.5865, y: 30.7690, radius: 350, initialRadius: 350, maxRadius: 950, severity: 8.2, type: 'fire' },   // Mamupur Feeder Substation Electrical Fire
      ];

      const initShelters: InfrastructureNode[] = [
        { id: 's1', name: 'CU Central Medical Centre & Health Dispensary', x: 76.5758, y: 30.7698, type: 'hospital', capacity: 250, status: 'operational' },
        { id: 's2', name: 'Gharuan Community Health Centre (CHC)', x: 76.5580, y: 30.7730, type: 'hospital', capacity: 220, status: 'operational' },
        { id: 's3', name: 'Mamupur Community High School Relief Shelter', x: 76.5855, y: 30.7685, type: 'shelter', capacity: 190, status: 'operational' },
        { id: 's4', name: 'CU Main Auditorium & Indoor Sports Arena Hub', x: 76.5740, y: 30.7715, type: 'shelter', capacity: 360, status: 'operational' },
      ];

      const initRoads: InfrastructureEdge[] = [
        { id: 'r1', source: 's1', target: 's2', length: 1950, weight: 1950, status: 'active', hazardProximity: 0.1 },
        { id: 'r2', source: 's1', target: 's3', length: 1100, weight: 14500, status: 'severed', hazardProximity: 0.95 }, // Ruptured through NH-05 Junction
        { id: 'r3', source: 's4', target: 's1', length: 420, weight: 420, status: 'active', hazardProximity: 0.2 },
        { id: 'r4', source: 's4', target: 's2', length: 1550, weight: 1550, status: 'active', hazardProximity: 0.2 },
      ];

      const initCasualties: Casualty[] = [];
      const qt = new QuadTree<HazardZone>(
        new Rectangle(GEO_MIN_LNG, GEO_MIN_LAT, GEO_MAX_LNG - GEO_MIN_LNG, GEO_MAX_LAT - GEO_MIN_LAT),
        4
      );
      for (const h of initHazards) qt.insert({ x: h.x, y: h.y, data: h });

      for (let i = 0; i < 26; i++) {
        const lat = 30.7660 + Math.random() * 0.0070;
        const lng = 76.5720 + Math.random() * 0.0130;
        const severity = parseFloat((4.5 + Math.random() * 5.2).toFixed(1));
        const age = Math.floor(18 + Math.random() * 45);

        const exp = ScientificRiskEngine.computeEnvironmentalExposure({ x: lng, y: lat }, qt);
        const { key, rawUrgency } = ScientificRiskEngine.calculateCasualtyPriorityKey(severity, exp, 10);
        const cat = ScientificRiskEngine.evaluateTriageCategory(severity, rawUrgency);

        const cas: Casualty = {
          id: `cas-${i + 1}`,
          name: `Campus Casualty #${200 + i}`,
          x: lng,
          y: lat,
          severity,
          age,
          category: cat,
          registeredAt: Date.now() - 1200000,
          elapsedWaitMinutes: 12,
          environmentalExposure: exp,
          calculatedPriorityScore: key,
          evacuated: false,
        };

        initCasualties.push(cas);
        const node = triageHeapRef.current.insert(key, cas, cas.id);
        casualtyNodeMapRef.current.set(cas.id, node);
      }

      setHazards(initHazards);
      setShelters(initShelters);
      setRoads(initRoads);
      setCasualties(initCasualties);
      rebuildQuadTree(initHazards);
      updateInfrastructureMST(initShelters, initRoads);
      recomputeEvacuationPaths(initCasualties, initShelters, qt);
    }
  }, [rebuildQuadTree, updateInfrastructureMST, recomputeEvacuationPaths]);

  // Initial load
  useEffect(() => {
    loadScenario('flood_catastrophe');
  }, [loadScenario]);

  /**
   * Simulation Loop Tick
   */
  const stepTick = useCallback(() => {
    setTickCount(t => t + 1);

    // Gently fluctuate hazard radii in meters with strict physical ceiling and containment mechanics
    setHazards(prevHazards => {
      const nextHazards = prevHazards.map(h => {
        // Enforce physical ceiling depending on hazard type
        const maxRadius = h.maxRadius || (
          h.type === 'flood' ? 2200 :
          h.type === 'toxic' ? 1400 :
          h.type === 'fire' ? 950 : 1800
        );
        const minFloor = h.initialRadius ? Math.max(160, h.initialRadius * 0.5) : 200;

        // Check if operational emergency shelters / medical hubs are containing this zone
        let nearbyIntervention = false;
        for (const s of shelters) {
          if (s.status === 'operational') {
            const dist = haversineDistanceMeters(h.y, h.x, s.y, s.x);
            if (dist <= h.radius + 800) {
              nearbyIntervention = true;
              break;
            }
          }
        }

        let expansionDelta = 0;

        if (h.radius >= maxRadius) {
          // Plateau reached: halt further expansion completely
          expansionDelta = 0;
          if (nearbyIntervention) {
            // Active emergency intervention containment decay
            expansionDelta = -(3.5 * simSpeed);
          } else {
            // Subtle micro-oscillation without expanding beyond maxRadius
            expansionDelta = Math.sin(Date.now() / 4000 + h.x * 50) > 0 ? (0.5 * simSpeed) : -(1.5 * simSpeed);
          }
        } else {
          // Hazard has not reached maximum ceiling yet
          if (nearbyIntervention) {
            // Emergency intervention dampens expansion or drives active containment
            const cycle = Math.sin(Date.now() / 3500 + h.x * 60);
            expansionDelta = cycle > 0.4 ? (1.5 * simSpeed) : -(3.0 * simSpeed);
          } else {
            // Natural expansion dynamics towards ceiling
            const cycle = Math.sin(Date.now() / 3000 + h.x * 80);
            expansionDelta = cycle > 0.1 ? (5.5 * simSpeed) : -(2.5 * simSpeed);
          }
        }

        // Clamp radius strictly: hazard.radius = Math.min(hazard.maxRadius || 2500, hazard.radius + expansionDelta)
        const nextRadius = Math.max(minFloor, Math.min(maxRadius, h.radius + expansionDelta));
        return {
          ...h,
          maxRadius,
          radius: Math.round(nextRadius),
        };
      });

      rebuildQuadTree(nextHazards);
      return nextHazards;
    });

    // Dynamic Road Severing check
    setRoads(prevRoads => {
      let changed = false;
      const updated = prevRoads.map(r => {
        const sourceNode = shelters.find(s => s.id === r.source);
        const targetNode = shelters.find(s => s.id === r.target);
        if (!sourceNode || !targetNode) return r;

        const midLng = (sourceNode.x + targetNode.x) / 2;
        const midLat = (sourceNode.y + targetNode.y) / 2;

        const penalty = ScientificRiskEngine.computeEnvironmentalExposure({ x: midLng, y: midLat }, quadTreeRef.current);
        const newProximity = Math.min(1.0, penalty / 10);

        let newStatus = r.status;
        if (newProximity > 0.88 && r.status === 'active') {
          newStatus = 'flooded';
          changed = true;
        }

        return { ...r, hazardProximity: newProximity, weight: r.length * (1 + newProximity * 2.5), status: newStatus };
      });

      if (changed) {
        updateInfrastructureMST(shelters, updated);
      }
      return updated;
    });

    // Update casualty triage and rebalance Fibonacci Heap
    updateTriagePriorities(casualties, hazards, quadTreeRef.current);

    // Recompute evacuation corridors
    recomputeEvacuationPaths(casualties, shelters, quadTreeRef.current);
  }, [simSpeed, rebuildQuadTree, shelters, updateInfrastructureMST, updateTriagePriorities, casualties, hazards, recomputeEvacuationPaths]);

  // Cycle interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      stepTick();
    }, 1200 / simSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, stepTick]);

  /**
   * Manual Geospatial Placements
   */
  const addCasualtyAt = (lng: number, lat: number, category?: TriageCategory) => {
    const sev = category === 'RED' ? 8.6 : category === 'YELLOW' ? 6.2 : category === 'GREEN' ? 3.2 : 0.5;
    const exp = ScientificRiskEngine.computeEnvironmentalExposure({ x: lng, y: lat }, quadTreeRef.current);
    const { key, rawUrgency } = ScientificRiskEngine.calculateCasualtyPriorityKey(sev, exp, 0);
    const cat = category || ScientificRiskEngine.evaluateTriageCategory(sev, rawUrgency);

    const newCas: Casualty = {
      id: `cas-${Date.now().toString(36)}`,
      name: `Floodplain Rescue #${casualties.length + 1}`,
      x: lng,
      y: lat,
      severity: sev,
      age: Math.floor(12 + Math.random() * 65),
      category: cat,
      registeredAt: Date.now(),
      elapsedWaitMinutes: 0,
      environmentalExposure: exp,
      calculatedPriorityScore: key,
      evacuated: false,
    };

    const node = triageHeapRef.current.insert(key, newCas, newCas.id);
    casualtyNodeMapRef.current.set(newCas.id, node);

    const nextCasualties = [newCas, ...casualties];
    setCasualties(nextCasualties);
    setHeapTelemetry(triageHeapRef.current.getTelemetry());
    recomputeEvacuationPaths(nextCasualties, shelters, quadTreeRef.current);
  };

  const addHazardAt = (lng: number, lat: number, type?: 'flood' | 'fire' | 'toxic' | 'seismic') => {
    const hType = type || selectedHazardType;
    const typeMaxRadius = hType === 'flood' ? 2200 : hType === 'toxic' ? 1400 : hType === 'fire' ? 950 : 1800;
    const initialR = hType === 'fire' ? 320 : hType === 'toxic' ? 380 : 450;

    const newHazard: HazardZone = {
      id: `h-${Date.now().toString(36)}`,
      x: lng,
      y: lat,
      radius: initialR,
      initialRadius: initialR,
      maxRadius: typeMaxRadius,
      severity: 8.5,
      type: hType,
    };

    const nextHazards = [...hazards, newHazard];
    setHazards(nextHazards);
    rebuildQuadTree(nextHazards);
    updateTriagePriorities(casualties, nextHazards, quadTreeRef.current);
  };

  const addShelterAt = (lng: number, lat: number) => {
    const newShelter: InfrastructureNode = {
      id: `s-${Date.now().toString(36)}`,
      name: `CU / Mohali Relief Muster Point #${shelters.length + 1}`,
      x: lng,
      y: lat,
      type: 'shelter',
      capacity: 150,
      status: 'operational',
    };

    const nextShelters = [...shelters, newShelter];
    setShelters(nextShelters);

    if (shelters.length > 0) {
      let nearest = shelters[0];
      let minD = Infinity;
      for (const s of shelters) {
        const d = haversineDistanceMeters(s.y, s.x, lat, lng);
        if (d < minD) {
          minD = d;
          nearest = s;
        }
      }

      const newRoad: InfrastructureEdge = {
        id: `r-${Date.now().toString(36)}`,
        source: nearest.id,
        target: newShelter.id,
        length: Math.round(minD),
        weight: Math.round(minD),
        status: 'active',
        hazardProximity: 0.1,
      };

      const nextRoads = [...roads, newRoad];
      setRoads(nextRoads);
      updateInfrastructureMST(nextShelters, nextRoads);
    }
  };

  const toggleRoadStatus = (roadId: string) => {
    setRoads(prev => {
      const updated = prev.map(r => {
        if (r.id === roadId) {
          const nextStatus = r.status === 'active' ? 'severed' : 'active';
          return { ...r, status: nextStatus as any };
        }
        return r;
      });
      updateInfrastructureMST(shelters, updated);
      return updated;
    });
  };

  /**
   * Casualty Evacuation with Guaranteed Fibonacci Heap extractMin Consolidation Pass
   */
  const evacuateCasualty = (casualtyId: string) => {
    const node = casualtyNodeMapRef.current.get(casualtyId);
    if (node) {
      // delete(node) decreases key to -Infinity and calls extractMin(),
      // which links roots of matching degrees and consolidates the heap!
      triageHeapRef.current.delete(node);
      casualtyNodeMapRef.current.delete(casualtyId);
    } else if (triageHeapRef.current.minNode) {
      triageHeapRef.current.extractMin();
    }

    setCasualties(prev => {
      const next = prev.map(c => (c.id === casualtyId ? { ...c, evacuated: true } : c));
      recomputeEvacuationPaths(next, shelters, quadTreeRef.current);
      const updatedMetrics = ScientificRiskEngine.computeDisasterMetrics(
        next,
        hazards,
        shelters,
        quadTreeRef.current
      );
      setMetrics(updatedMetrics);
      return next;
    });
    setHeapTelemetry(triageHeapRef.current.getTelemetry());
  };

  /**
   * Direct Dispatch of Top Priority Casualty via extractMin()
   */
  const dispatchNextCritical = () => {
    const min = triageHeapRef.current.extractMin();
    if (min) {
      const cas = min.value;
      casualtyNodeMapRef.current.delete(cas.id);
      setCasualties(prev => {
        const next = prev.map(c => (c.id === cas.id ? { ...c, evacuated: true } : c));
        recomputeEvacuationPaths(next, shelters, quadTreeRef.current);
        const updatedMetrics = ScientificRiskEngine.computeDisasterMetrics(
          next,
          hazards,
          shelters,
          quadTreeRef.current
        );
        setMetrics(updatedMetrics);
        return next;
      });
      setHeapTelemetry(triageHeapRef.current.getTelemetry());
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        toolMode,
        setToolMode,
        selectedHazardType,
        setSelectedHazardType,
        selectedCasualtyCategory,
        setSelectedCasualtyCategory,
        isPlaying,
        togglePlay: () => setIsPlaying(p => !p),
        simSpeed,
        setSimSpeed,
        tickCount,
        stepTick,
        currentScenario,
        loadScenario,
        showQuadTreeOverlay,
        setShowQuadTreeOverlay,
        showMSTOverlay,
        setShowMSTOverlay,
        showEvacuationCorridors,
        setShowEvacuationCorridors,
        hazards,
        casualties,
        shelters,
        roads,
        evacuationPaths,
        hazardQuadTree: quadTreeRef.current,
        triageHeap: triageHeapRef.current,
        mstResult,
        metrics,
        heapTelemetry,
        selectedEntity,
        setSelectedEntity,
        addCasualtyAt,
        addHazardAt,
        addShelterAt,
        toggleRoadStatus,
        evacuateCasualty,
        dispatchNextCritical,
        heapBenchmarks,
        setHeapBenchmarks,
        spatialBenchmarks,
        setSpatialBenchmarks,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
};
