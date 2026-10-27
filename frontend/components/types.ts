export interface FeatureDriver {
  feature: string;
  label?: string;
  attributionF: number;
}

export interface SiteData {
  id: number;
  name: string;
  tractId: string;
  shortTract?: string;
  lat: number;
  lon: number;
  offsetF: number;
  daysAbove95: number;
  residentsReached: number;
  annualCost: string;
  dominantDriver: string;
  dominantDiagnosis: string;
  drivers: FeatureDriver[];
  demographics: {
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
  funded: boolean;
}

export interface CityBaseline {
  totalPop: number;
  povertyRatePct: number;
  noVehiclePct: number;
  age65PlusPct: number;
  medianIncome: number;
  blackPct?: number;
  whitePct?: number;
  hispanicPct?: number;
}

export interface TractScatterPoint {
  geo_id: string;
  lat: number;
  lon: number;
  offset_f: number;
  no_car_pct: number;
  age_65_pct: number;
  poverty_pct: number;
  median_income: number;
}
