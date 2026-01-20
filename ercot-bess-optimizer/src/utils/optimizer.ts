import {
  ConfidenceLabel,
  ControlState,
  DecisionResult,
  ForecastPoint,
  StrategyScore,
  VirtualDirection,
} from '../types'

const confidenceLabels: ConfidenceLabel[] = ['Low', 'Medium', 'High']

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const getConfidenceLabel = (index: number): ConfidenceLabel =>
  confidenceLabels[clamp(index, 0, confidenceLabels.length - 1)]

export const getConfidenceScore = (
  index: number,
  forecastFragile: boolean
) => {
  const base = [0.45, 0.7, 0.9][clamp(index, 0, 2)]
  return clamp(base * (forecastFragile ? 0.85 : 1), 0.2, 0.98)
}

interface DecisionInputs {
  controls: ControlState
  forecast: ForecastPoint[]
  currentIndex: number
  avgRt: number
  totalPnl: number
}

export const evaluateDecision = ({
  controls,
  forecast,
  currentIndex,
  avgRt,
  totalPnl,
}: DecisionInputs): DecisionResult => {
  const pricePoint = forecast[currentIndex]
  const confidenceScore = getConfidenceScore(
    controls.confidenceIndex,
    controls.forecastFragile
  )
  const confidenceLabel = getConfidenceLabel(controls.confidenceIndex)
  const scarcityProb = controls.scarcityLikelihood / 100
  const speedFactor = controls.rampSpeed / 100
  const degradationFactor = controls.degradationSensitivity / 100

  const effectiveMinSoc = controls.protectScarcity
    ? Math.max(controls.minSoc, controls.reservedSoc)
    : controls.minSoc
  const socRange = Math.max(controls.maxSoc - effectiveMinSoc, 1)
  const socHeadroomUp = clamp((controls.soc - effectiveMinSoc) / socRange, 0, 1)
  const socHeadroomDown = clamp(
    (controls.maxSoc - controls.soc) / socRange,
    0,
    1
  )
  const asHeadroom = clamp(Math.min(socHeadroomUp, socHeadroomDown), 0, 1)
  const cycleTightness = clamp(
    1 - controls.cycleBudgetDaily / Math.max(controls.maxDailyCycles, 0.1),
    0,
    1
  )

  const physicalDirection: 'Charge' | 'Discharge' =
    pricePoint.rtForecast >= avgRt ? 'Discharge' : 'Charge'
  const directionHeadroom =
    physicalDirection === 'Discharge' ? socHeadroomUp : socHeadroomDown

  const spreadSignal =
    controls.expectedDASpread * 0.8 + controls.expectedRTVolatility * 0.4
  const physicalBase = spreadSignal + directionHeadroom * 25
  const confidencePenalty = controls.ignoreConfidence
    ? 0
    : (1 - confidenceScore) * (0.6 + controls.bandWidth / 100) * 35
  const degradationPenalty =
    (12 + degradationFactor * 28) * (0.6 + cycleTightness)
  const physicalPenalty = controls.alwaysChaseSpread
    ? degradationPenalty * 0.4
    : degradationPenalty
  let physicalScore =
    physicalBase * (0.55 + directionHeadroom) -
    confidencePenalty -
    physicalPenalty
  if (controls.alwaysChaseSpread) {
    physicalScore += 15
  }
  if (directionHeadroom < 0.1) {
    physicalScore -= 30
  }

  const ancillaryBase =
    controls.ancillaryPriceLevel *
    (0.9 + (controls.rtcMode ? 0.1 : -0.05))
  let ancillaryScore =
    ancillaryBase * (0.6 + asHeadroom) * (0.7 + speedFactor * 0.6)
  if (controls.rtcMode) {
    ancillaryScore -= (1 - asHeadroom) * 12
  }
  if (controls.forecastFragile) {
    ancillaryScore += 4
  }
  if (asHeadroom < 0.2) {
    ancillaryScore -= 20
  }

  const daRtSpread = pricePoint.rtForecast - pricePoint.da
  const virtualDirection: VirtualDirection =
    daRtSpread >= 0 ? 'INC-like' : 'DEC-like'
  const exposureRatio =
    controls.virtualMw / Math.max(controls.maxVirtualMw, 1)
  const virtualBase =
    Math.abs(daRtSpread) * 2.2 + controls.expectedDASpread * 0.3
  let virtualScore = virtualBase * (0.6 + confidenceScore) * exposureRatio
  if (!controls.ignoreConfidence) {
    virtualScore -= (1 - confidenceScore) * 30
  }
  if (controls.forecastFragile) {
    virtualScore -= 6
  }
  if (controls.useVirtualsToPreserveBatteryLife && cycleTightness > 0.4) {
    virtualScore += 12
  }
  if (controls.virtualMw <= 0) {
    virtualScore = 0
  }

  let holdScore =
    scarcityProb * 80 + (1 - confidenceScore) * 35 + cycleTightness * 30
  if (controls.protectScarcity) {
    holdScore += 8
  }
  if (controls.neverHoldScarcity) {
    holdScore -= 60
  }
  if (controls.alwaysChaseSpread) {
    holdScore -= 12
  }
  if (controls.ignoreConfidence) {
    holdScore -= 6
  }

  const lossLimit = 250 + controls.powerMw * 1.5
  if (controls.lossLimitEnabled && totalPnl < -lossLimit) {
    holdScore += 120
  }

  const strategyScores: StrategyScore[] = [
    {
      type: 'Physical',
      score: clamp(physicalScore, 0, 120),
      label: 'Physical Dispatch',
      detail:
        physicalDirection === 'Discharge'
          ? 'High price window favors discharge.'
          : 'Low price window favors charging.',
    },
    {
      type: 'Ancillary',
      score: clamp(ancillaryScore, 0, 120),
      label: 'Ancillary Services',
      detail: controls.rtcMode
        ? 'Speed value with RTC+B co-optimization.'
        : 'Availability revenue with simplified scheduling.',
    },
    {
      type: 'Virtual',
      score: clamp(virtualScore, 0, 120),
      label: 'DA Virtuals',
      detail:
        virtualDirection === 'INC-like'
          ? 'RT forecast above DA.'
          : 'RT forecast below DA.',
    },
    {
      type: 'Hold',
      score: clamp(holdScore, 0, 120),
      label: 'Hold for Scarcity',
      detail:
        scarcityProb > 0.4
          ? 'Scarcity tail option dominates.'
          : 'Preserve optionality under uncertainty.',
    },
  ]

  const sorted = [...strategyScores].sort((a, b) => b.score - a.score)
  const topTwo = sorted.slice(0, 2)

  const bestStrategy = sorted[0].type
  let bestAction: DecisionResult['bestAction'] = 'Hold SOC'
  if (bestStrategy === 'Physical') {
    bestAction = physicalDirection
  } else if (bestStrategy === 'Ancillary') {
    bestAction = 'Provide Ancillary'
  } else if (bestStrategy === 'Virtual') {
    bestAction = 'DA Virtual'
  }

  const constraint = (() => {
    if (cycleTightness > 0.65) {
      return 'Cycle budget is tight; low-throughput options are favored.'
    }
    if (socHeadroomUp < 0.2 || socHeadroomDown < 0.2) {
      return 'SOC headroom is binding; feasibility limits dispatch.'
    }
    if (controls.rtcMode) {
      return 'RTC+B requires SOC feasibility every interval.'
    }
    return 'SOC bounds and exposure caps frame the decision.'
  })()

  const risk = (() => {
    if (controls.forecastFragile) {
      return 'Regime shift risk is elevated; avoid over-committing.'
    }
    if (confidenceScore < 0.6) {
      return 'Low confidence raises forecast error risk.'
    }
    if (controls.alwaysChaseSpread) {
      return 'Spread chasing accelerates degradation.'
    }
    return 'Risk-adjusted returns dominate raw spreads.'
  })()

  const signal = (() => {
    if (bestStrategy === 'Virtual') {
      return 'DA-RT mispricing is forecastable with enough confidence.'
    }
    if (bestStrategy === 'Ancillary') {
      return 'Ancillary prices pay for speed and availability.'
    }
    if (bestStrategy === 'Physical') {
      return 'The spread and volatility justify cycling right now.'
    }
    return 'Scarcity optionality outweighs near-term spreads.'
  })()

  const alternative = (() => {
    const runnerUp = topTwo[1]
    if (!runnerUp) {
      return 'No close alternative was competitive.'
    }
    if (runnerUp.type === 'Physical' && cycleTightness > 0.5) {
      return 'Physical cycling was rejected due to cycle pressure.'
    }
    if (runnerUp.type === 'Virtual' && confidenceScore < 0.6) {
      return 'Virtuals were rejected due to confidence haircuts.'
    }
    if (runnerUp.type === 'Ancillary' && asHeadroom < 0.3) {
      return 'Ancillary was limited by SOC headroom.'
    }
    return `${runnerUp.label} lost on risk-adjusted value.`
  })()

  const traceNote = `${topTwo[0].label} wins after confidence and cycle adjustments.`

  return {
    bestAction,
    bestStrategy,
    physicalDirection,
    virtualDirection,
    strategyScores,
    topTwo,
    rationale: {
      signal,
      constraint,
      risk,
      alternative,
      traceNote,
    },
    confidenceLabel,
    confidenceScore,
    asHeadroom,
    cycleTightness,
  }
}
