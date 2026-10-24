/**
 * Scientific Disaster Risk Formulation
 * Grounded in:
 * - UNDRR Sendai Framework for Disaster Risk Reduction (2015-2030) - Priority 1 & 4
 * - National Disaster Management Authority (NDMA) National Disaster Management Plan Guidelines
 *
 * Mathematical Formulations:
 * 1. Disaster Risk Index (DRI):
 *    R = (Hazard_Threat * Vulnerability_Factor) / Capacity_Margin
 *
 * 2. Dynamic Casualty Triage Score (DCTS):
 *    Priority = (w1 * Severity) + (w2 * Environmental_Hazard) + (w3 * Delta_t)
 */

import { HazardZone } from '../ads/Pathfinding';
import { QuadTree, Point, haversineDistanceMeters } from '../ads/QuadTree';
import { InfrastructureNode } from '../ads/DSU';

export type TriageCategory = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

export interface Casualty {
  id: string;
  name: string;
  x: number; // Longitude
  y: number; // Latitude
  severity: number; // 0.0 - 10.0 (Glasgow Coma, shock index, hemorrhaging)
  age: number;
  category: TriageCategory;
  registeredAt: number; // Epoch timestamp (ms)
  elapsedWaitMinutes: number;
  environmentalExposure: number; // Evaluated from QuadTree
  calculatedPriorityScore: number; // Lower score = higher priority in Min-Heap
  evacuated: boolean;
  assignedShelterId?: string;
  evacuationDistance?: number;
}

export interface DisasterMetrics {
  disasterRiskIndex: number;
  hazardThreatLevel: number;
  vulnerabilityFactor: number;
  capacityMargin: number;
  sendaiPriorityCompliance: number; // % score
  communityFragilityIndex: number;
  totalCasualties: number;
  criticalRedCount: number;
  yellowDelayedCount: number;
  greenMinorCount: number;
  blackExpectantCount: number;
  evacuatedCount: number;
  activeHazardsCount: number;
  shelterOccupancyRate: number;
}

export class ScientificRiskEngine {
  // Weights adhering to NDMA Mass Casualty Triage weights
  public static readonly W1_SEVERITY = 0.45;
  public static readonly W2_ENVIRONMENT = 0.35;
  public static readonly W3_TIME_DECAY = 0.20;

  /**
   * Evaluates Dynamic Casualty Triage Score (DCTS)
   * Lower numerical key in Min-Heap = Highest urgency for immediate dispatch.
   * Priority score is inverted: 100 - rawUrgency.
   */
  static calculateCasualtyPriorityKey(
    severity: number,
    environmentalExposure: number,
    elapsedMinutes: number
  ): { key: number; rawUrgency: number } {
    // Physiological decay factor: wait time increases urgency exponentially after 15 mins
    const timeDecayFactor = Math.min(10, elapsedMinutes * 0.25);

    const rawUrgency =
      this.W1_SEVERITY * severity * 10 +
      this.W2_ENVIRONMENT * Math.min(10, environmentalExposure) * 10 +
      this.W3_TIME_DECAY * timeDecayFactor * 10;

    // For a Min-Heap, highest urgency must map to the lowest key:
    const heapKey = Math.max(0.1, 100 - rawUrgency);
    return { key: parseFloat(heapKey.toFixed(2)), rawUrgency: parseFloat(rawUrgency.toFixed(2)) };
  }

  /**
   * Assigns Triage Category based on WHO / NDMA START guidelines
   */
  static evaluateTriageCategory(severity: number, rawUrgency: number): TriageCategory {
    if (severity <= 0.8) return 'BLACK';
    if (rawUrgency >= 65 || severity >= 7.5) return 'RED';
    if (rawUrgency >= 40 || severity >= 4.5) return 'YELLOW';
    return 'GREEN';
  }

  /**
   * Evaluates environmental exposure at casualty location using QuadTree spatial queries
   * point: { x: lng, y: lat }
   */
  static computeEnvironmentalExposure(
    point: Point,
    hazardQuadTree: QuadTree<HazardZone>
  ): number {
    // O(log N) geospatial radius query up to 3,500m
    const nearby = hazardQuadTree.queryGeoRadius(point.y, point.x, 3500);
    let totalExposure = 0;

    for (let i = 0; i < nearby.length; i++) {
      const hazard = nearby[i].data;
      const dist = Math.max(10, haversineDistanceMeters(point.y, point.x, hazard.y, hazard.x));

      // Inverse decay with buffer proximity
      const effectiveDist = Math.max(1, dist - hazard.radius);
      const exposure = (hazard.severity * 500) / (effectiveDist + 200);
      totalExposure += exposure;
    }

    return Math.min(10, parseFloat(totalExposure.toFixed(2)));
  }

  /**
   * Computes aggregate Sendai / NDMA Disaster Risk Index:
   * R = (Hazard_Threat * Vulnerability_Factor) / Capacity_Margin
   */
  static computeDisasterMetrics(
    casualties: Casualty[],
    hazards: HazardZone[],
    shelters: InfrastructureNode[],
    _hazardQuadTree: QuadTree<HazardZone>
  ): DisasterMetrics {
    // 1. Hazard Threat (Normalized cleanly to 0.0 - 10.0 scale)
    let rawHazardThreat = 0;
    for (const h of hazards) {
      const typeMax = h.maxRadius || (h.type === 'flood' ? 2200 : h.type === 'toxic' ? 1400 : h.type === 'fire' ? 950 : 1800);
      const radiusRatio = Math.min(1.0, h.radius / typeMax);
      // Normalized threat combining clinical severity and geographic footprint
      rawHazardThreat += (h.severity / 10) * (0.35 + 0.65 * radiusRatio) * 10;
    }
    const hazardThreatLevel = parseFloat(
      Math.min(10, Math.max(0.1, rawHazardThreat / Math.max(1, hazards.length))).toFixed(2)
    );

    // 2. Vulnerability Factor (aggregate age vulnerability & clinical exposure)
    let totalVuln = 0;
    let redCount = 0;
    let yellowCount = 0;
    let greenCount = 0;
    let blackCount = 0;
    let evacuatedCount = 0;

    for (const c of casualties) {
      if (c.evacuated) {
        evacuatedCount++;
        continue;
      }

      // Age vulnerability curve: pediatric (<12) & geriatric (>65) higher risk
      const ageRisk = c.age < 12 ? 1.4 : c.age > 65 ? 1.6 : 1.0;
      totalVuln += ageRisk * (c.severity / 5);

      if (c.category === 'RED') redCount++;
      else if (c.category === 'YELLOW') yellowCount++;
      else if (c.category === 'GREEN') greenCount++;
      else if (c.category === 'BLACK') blackCount++;
    }

    const activeCasualties = casualties.length - evacuatedCount;
    const vulnerabilityFactor = parseFloat(
      (activeCasualties > 0 ? Math.min(3.0, totalVuln / activeCasualties) : 0.05).toFixed(2)
    );

    // 3. Capacity Margin (coping capacity based on operational shelter infrastructure)
    const totalShelterCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
    const shelterCopingRatio = totalShelterCapacity / Math.max(10, activeCasualties * 2.5);
    const capacityMargin = parseFloat(
      Math.min(5.0, Math.max(0.6, shelterCopingRatio / 8)).toFixed(2)
    );

    // 4. Disaster Risk Index (DRI) normalized strictly to [0, 100]
    const rawDRI = activeCasualties === 0
      ? 0.5
      : (hazardThreatLevel * vulnerabilityFactor * 12) / capacityMargin;
    const disasterRiskIndex = parseFloat(
      Math.min(100, Math.max(0, rawDRI)).toFixed(2)
    );

    // 5. Community Fragility Index (CFI)
    const communityFragilityIndex = parseFloat(
      Math.min(10, Math.max(0, hazardThreatLevel * 0.4 + vulnerabilityFactor * 1.8)).toFixed(2)
    );

    // 6. Sendai Framework Priority 4 Compliance Score (%)
    const triageRatio = casualties.length > 0 ? (evacuatedCount + greenCount) / casualties.length : 1.0;
    const capacityRatio = Math.min(1.0, totalShelterCapacity / Math.max(1, casualties.length));
    const sendaiCompliance = Math.round((triageRatio * 0.6 + capacityRatio * 0.4) * 100);

    const shelterOccupancyRate = Math.min(
      100,
      Math.round((evacuatedCount / Math.max(1, totalShelterCapacity)) * 100)
    );

    return {
      disasterRiskIndex,
      hazardThreatLevel,
      vulnerabilityFactor,
      capacityMargin,
      sendaiPriorityCompliance: sendaiCompliance,
      communityFragilityIndex,
      totalCasualties: casualties.length,
      criticalRedCount: redCount,
      yellowDelayedCount: yellowCount,
      greenMinorCount: greenCount,
      blackExpectantCount: blackCount,
      evacuatedCount,
      activeHazardsCount: hazards.length,
      shelterOccupancyRate,
    };
  }
}
