import type { ForecastPoint, IntervalMode, PricePoint } from '../types'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const mulberry32 = (seed: number) => {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const formatTime = (hour: number) => {
  const totalMinutes = Math.round(hour * 60)
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export interface SeriesInputs {
  expectedDASpread: number
  expectedRTVolatility: number
  scarcityLikelihood: number
  intervalMode: IntervalMode
}

export const getStepsForInterval = (intervalMode: IntervalMode) =>
  intervalMode === '5m' ? 288 : 96

export const generatePriceSeries = ({
  expectedDASpread,
  expectedRTVolatility,
  scarcityLikelihood,
  intervalMode,
}: SeriesInputs): PricePoint[] => {
  const steps = getStepsForInterval(intervalMode)
  const seed =
    Math.round(expectedDASpread * 13) +
    Math.round(expectedRTVolatility * 7) +
    Math.round(scarcityLikelihood * 17) +
    steps
  const rand = mulberry32(seed)

  const spreadFactor = expectedDASpread / 100
  const volatility = expectedRTVolatility / 100
  const scarcity = scarcityLikelihood / 100

  return Array.from({ length: steps }, (_, index) => {
    const hour = (index / steps) * 24
    const diurnal = 10 * Math.sin(((hour - 6) / 24) * Math.PI * 2)
    const middayDip = -9 * Math.exp(-Math.pow((hour - 13) / 3.5, 2))
    const eveningPeak = 28 * Math.exp(-Math.pow((hour - 19) / 2.5, 2))
    const spreadShape =
      spreadFactor * 14 * Math.sin(((hour - 2) / 24) * Math.PI * 2)
    const da = 28 + diurnal + middayDip + eveningPeak + spreadShape
    const scarcityWindow = hour >= 17.5 && hour <= 21.5
    const scarcityBoost = scarcityWindow ? scarcity * (8 + rand() * 40) : 0
    const noise = (rand() - 0.5) * 2 * (6 + volatility * 18)
    const rt = da + noise + scarcityBoost

    return {
      index,
      time: formatTime(hour),
      hour,
      da: clamp(da, -20, 300),
      rt: clamp(rt, -20, 500),
    }
  })
}

export interface ForecastInputs {
  confidenceScore: number
  bandWidth: number
  forecastFragile: boolean
}

export const generateForecastSeries = (
  prices: PricePoint[],
  { confidenceScore, bandWidth, forecastFragile }: ForecastInputs
): ForecastPoint[] => {
  const seed =
    Math.round(confidenceScore * 100) +
    Math.round(bandWidth * 19) +
    (forecastFragile ? 77 : 13)
  const rand = mulberry32(seed)
  const fragilityPenalty = forecastFragile ? 0.18 : 0

  return prices.map((point) => {
    const bias =
      (rand() - 0.5) * 2 * (1 - confidenceScore + fragilityPenalty) * 4
    const rtForecast =
      point.da +
      (point.rt - point.da) * (0.45 + confidenceScore * 0.55) +
      bias
    const bandBase = 5 + (bandWidth / 100) * 22
    const band =
      bandBase * (0.8 + (1 - confidenceScore) * 1.4 + fragilityPenalty)
    const lower = rtForecast - band
    const upper = rtForecast + band

    return {
      ...point,
      rtForecast: clamp(rtForecast, -30, 500),
      lower: clamp(lower, -60, 450),
      upper: clamp(upper, -30, 550),
      band: clamp(upper - lower, 0, 600),
    }
  })
}
