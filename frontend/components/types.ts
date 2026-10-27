export interface FeatureDriver {
  feature: string;
  label?: string;
  attributionF: number;
  deltaF?: number;
  description?: string;
}

export interface SiteData {
  id: number;
  name: string;
  neighborhood?: string;
  addressHint?: string;
  tractId: string;
  shortTract: string;
  lat: number;
  lon?: number;
  lng: number;
  offsetF: number;
  daysAbove95?: number;
  hotDaysPerSummer?: number;
  residentsReached: number;
  annualCost?: string;
  estAnnualCost?: string;
  annualCostNum?: number;
  dominantDriver: string;
  dominantDiagnosis: string;
  recommendedIntervention?: string;
  drivers: FeatureDriver[];
  noCarPct: number;
  seniorsPct: number;
  povertyRate: number;
  medianIncome: number;
  blackPct?: number;
  whitePct?: number;
  hispanicPct?: number;
  demographics?: {
    noVehiclePct: number;
    age65PlusPct: number;
    povertyRatePct: number;
    medianIncome: number;
    totalPop: number;
    blackPct?: number;
    whitePct?: number;
    hispanicPct?: number;
  };
  whyNotChosen?: string;
  funded?: boolean;
  isFunded?: boolean;
  isUnmeasuredPredicted?: boolean;
  mapX?: number;
  mapY?: number;
}

export interface CityBaseline {
  totalPop?: number;
  povertyRatePct?: number;
  povertyRate: number;
  noVehiclePct?: number;
  noCarPct: number;
  age65PlusPct?: number;
  seniorsPct: number;
  medianIncome: number;
  blackPct?: number;
  whitePct?: number;
  hispanicPct?: number;
  asianPct?: number;
}

export interface TractScatterPoint {
  geo_id: string;
  geoid?: string;
  lat: number;
  lon: number;
  population?: number;
  offset_f: number;
  heatOffsetF?: number;
  no_car_pct: number;
  noCarPct?: number;
  age_65_pct: number;
  seniorsPct?: number;
  poverty_pct: number;
  median_income: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
  agentName?: string;
  latencyMs?: number;
  toolsUsed?: string[];
  sitesReturned?: number;
}
