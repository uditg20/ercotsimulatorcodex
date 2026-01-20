export type ConfidenceLabel = 'Low' | 'Medium' | 'High'
export type IntervalMode = '15m' | '5m'
export type StrategyType = 'Physical' | 'Ancillary' | 'Virtual' | 'Hold'
export type ActionType =
  | 'Charge'
  | 'Discharge'
  | 'Provide Ancillary'
  | 'DA Virtual'
  | 'Hold SOC'
export type VirtualDirection = 'INC-like' | 'DEC-like'

export interface ControlState {
  expectedDASpread: number
  expectedRTVolatility: number
  ancillaryPriceLevel: number
  scarcityLikelihood: number
  confidenceIndex: number
  bandWidth: number
  forecastFragile: boolean
  soc: number
  powerMw: number
  durationHours: number
  efficiency: number
  minSoc: number
  maxSoc: number
  cycleBudgetDaily: number
  cycleBudgetAnnual: number
  degradationSensitivity: number
  rampSpeed: number
  maxDailyCycles: number
  maxVirtualMw: number
  virtualMw: number
  lossLimitEnabled: boolean
  protectScarcity: boolean
  reservedSoc: number
  useVirtualsToPreserveBatteryLife: boolean
  rtcMode: boolean
  intervalMode: IntervalMode
  showScarcityWindow: boolean
  ignoreConfidence: boolean
  alwaysChaseSpread: boolean
  neverHoldScarcity: boolean
}

export interface PricePoint {
  index: number
  time: string
  hour: number
  da: number
  rt: number
}

export interface ForecastPoint extends PricePoint {
  rtForecast: number
  lower: number
  upper: number
  band: number
}

export interface StrategyScore {
  type: StrategyType
  score: number
  label: string
  detail: string
}

export interface DecisionRationale {
  signal: string
  constraint: string
  risk: string
  alternative: string
  traceNote: string
}

export interface DecisionResult {
  bestAction: ActionType
  bestStrategy: StrategyType
  physicalDirection: 'Charge' | 'Discharge'
  virtualDirection: VirtualDirection
  strategyScores: StrategyScore[]
  topTwo: StrategyScore[]
  rationale: DecisionRationale
  confidenceLabel: ConfidenceLabel
  confidenceScore: number
  asHeadroom: number
  cycleTightness: number
}
