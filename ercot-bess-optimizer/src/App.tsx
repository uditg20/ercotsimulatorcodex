import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import ControlSlider from './components/ControlSlider'
import ToggleSwitch from './components/ToggleSwitch'
import ForecastChart from './components/ForecastChart'
import ValueBars from './components/ValueBars'
import ConstraintGauges from './components/ConstraintGauges'
import DecisionEngine from './components/DecisionEngine'
import RationalePanel from './components/RationalePanel'
import ScenarioPresets from './components/ScenarioPresets'
import PnLAttribution from './components/PnLAttribution'
import VirtualsModule from './components/VirtualsModule'
import AncillaryModule from './components/AncillaryModule'
import BreakItPanel from './components/BreakItPanel'
import { scenarioPresets } from './data/presets'
import { generateForecastSeries, generatePriceSeries } from './utils/series'
import { evaluateDecision, getConfidenceLabel, getConfidenceScore } from './utils/optimizer'
import type { ControlState } from './types'

function App() {
  const defaultControls: ControlState = {
    expectedDASpread: 55,
    expectedRTVolatility: 50,
    ancillaryPriceLevel: 55,
    scarcityLikelihood: 35,
    confidenceIndex: 1,
    bandWidth: 40,
    forecastFragile: false,
    soc: 52,
    powerMw: 100,
    durationHours: 4,
    efficiency: 0.9,
    minSoc: 10,
    maxSoc: 90,
    cycleBudgetDaily: 1.6,
    cycleBudgetAnnual: 220,
    degradationSensitivity: 50,
    rampSpeed: 70,
    maxDailyCycles: 2.2,
    maxVirtualMw: 120,
    virtualMw: 60,
    lossLimitEnabled: true,
    protectScarcity: true,
    reservedSoc: 20,
    useVirtualsToPreserveBatteryLife: true,
    rtcMode: true,
    intervalMode: '15m',
    showScarcityWindow: true,
    ignoreConfidence: false,
    alwaysChaseSpread: false,
    neverHoldScarcity: false,
  }

  const [controls, setControls] = useState<ControlState>(defaultControls)
  const [currentStep, setCurrentStep] = useState(0)
  const [pnl, setPnl] = useState({
    energy: 0,
    ancillary: 0,
    virtual: 0,
    degradation: 0,
    forecastError: 0,
  })
  const [activePresetId, setActivePresetId] = useState<string | undefined>()

  const confidenceScore = useMemo(
    () => getConfidenceScore(controls.confidenceIndex, controls.forecastFragile),
    [controls.confidenceIndex, controls.forecastFragile]
  )

  const prices = useMemo(
    () =>
      generatePriceSeries({
        expectedDASpread: controls.expectedDASpread,
        expectedRTVolatility: controls.expectedRTVolatility,
        scarcityLikelihood: controls.scarcityLikelihood,
        intervalMode: controls.intervalMode,
      }),
    [
      controls.expectedDASpread,
      controls.expectedRTVolatility,
      controls.scarcityLikelihood,
      controls.intervalMode,
    ]
  )

  const forecast = useMemo(
    () =>
      generateForecastSeries(prices, {
        confidenceScore,
        bandWidth: controls.bandWidth,
        forecastFragile: controls.forecastFragile,
      }),
    [prices, confidenceScore, controls.bandWidth, controls.forecastFragile]
  )

  const avgRt = useMemo(
    () => prices.reduce((sum, point) => sum + point.rt, 0) / prices.length,
    [prices]
  )

  const totalPnl =
    pnl.energy +
    pnl.ancillary +
    pnl.virtual +
    pnl.degradation +
    pnl.forecastError

  const decision = useMemo(
    () =>
      evaluateDecision({
        controls,
        forecast,
        currentIndex: currentStep,
        avgRt,
        totalPnl,
      }),
    [controls, forecast, currentStep, avgRt, totalPnl]
  )

  const controlsRef = useRef(controls)
  const decisionRef = useRef(decision)
  const pricesRef = useRef(prices)
  const forecastRef = useRef(forecast)

  useEffect(() => {
    controlsRef.current = controls
  }, [controls])

  useEffect(() => {
    decisionRef.current = decision
  }, [decision])

  useEffect(() => {
    pricesRef.current = prices
    forecastRef.current = forecast
  }, [prices, forecast])

  const intervalMs = controls.intervalMode === '5m' ? 500 : 900

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentStep((prevStep) => {
        const steps = pricesRef.current.length || 1
        const nextStep = (prevStep + 1) % steps
        const currentDecision = decisionRef.current
        const currentControls = controlsRef.current
        const pricePoint = pricesRef.current[prevStep]
        const forecastPoint = forecastRef.current[prevStep]

        if (!pricePoint || !forecastPoint) {
          return nextStep
        }

        const stepHours =
          currentControls.intervalMode === '5m' ? 1 / 12 : 0.25
        const capacityMwh = Math.max(
          currentControls.powerMw * currentControls.durationHours,
          1
        )
        const intervalMwh = currentControls.powerMw * stepHours
        const socDelta = (intervalMwh / capacityMwh) * 100
        const effectiveMinSoc = currentControls.protectScarcity
          ? Math.max(currentControls.minSoc, currentControls.reservedSoc)
          : currentControls.minSoc

        let nextSoc = currentControls.soc
        let cycleUse = 0
        let energyDelta = 0
        let asDelta = 0
        let virtualDelta = 0
        let degradationDelta = 0
        let forecastErrorDelta = 0

        if (currentDecision.bestAction === 'Charge') {
          if (currentControls.soc < currentControls.maxSoc) {
            nextSoc = Math.min(
              currentControls.maxSoc,
              currentControls.soc + socDelta * currentControls.efficiency
            )
            energyDelta -= intervalMwh * pricePoint.rt
            cycleUse = 0.08 * (currentControls.alwaysChaseSpread ? 1.4 : 1)
            degradationDelta -=
              (4 + currentControls.degradationSensitivity / 100 * 10) *
              cycleUse *
              20
            const chargeError = forecastPoint.rtForecast - pricePoint.rt
            forecastErrorDelta += chargeError * 2
          }
        }

        if (currentDecision.bestAction === 'Discharge') {
          if (currentControls.soc > effectiveMinSoc) {
            nextSoc = Math.max(
              effectiveMinSoc,
              currentControls.soc - socDelta
            )
            energyDelta +=
              intervalMwh * pricePoint.rt * currentControls.efficiency
            cycleUse = 0.08 * (currentControls.alwaysChaseSpread ? 1.4 : 1)
            degradationDelta -=
              (4 + currentControls.degradationSensitivity / 100 * 10) *
              cycleUse *
              20
            const dischargeError = pricePoint.rt - forecastPoint.rtForecast
            forecastErrorDelta += dischargeError * 2
          }
        }

        if (currentDecision.bestAction === 'Provide Ancillary') {
          asDelta +=
            intervalMwh * (currentControls.ancillaryPriceLevel / 100) * 15
        }

        if (currentDecision.bestAction === 'DA Virtual') {
          const actualSpread = pricePoint.rt - pricePoint.da
          const forecastSpread = forecastPoint.rtForecast - forecastPoint.da
          const direction =
            currentDecision.virtualDirection === 'INC-like' ? 1 : -1
          virtualDelta +=
            currentControls.virtualMw * stepHours * actualSpread * direction * 0.6
          const spreadError = (actualSpread - forecastSpread) * direction
          forecastErrorDelta += spreadError * 6
        }

        if (currentControls.ignoreConfidence) {
          forecastErrorDelta *= 1.4
        }

        setPnl((prev) => ({
          energy: prev.energy + energyDelta,
          ancillary: prev.ancillary + asDelta,
          virtual: prev.virtual + virtualDelta,
          degradation: prev.degradation + degradationDelta,
          forecastError: prev.forecastError + forecastErrorDelta,
        }))

        setControls((prev) => ({
          ...prev,
          soc: nextSoc,
          cycleBudgetDaily: Math.max(prev.cycleBudgetDaily - cycleUse, 0),
          cycleBudgetAnnual: Math.max(prev.cycleBudgetAnnual - cycleUse * 260, 0),
        }))

        return nextStep
      })
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs])

  const updateControls = (patch: Partial<ControlState>) =>
    setControls((prev) => {
      const next = { ...prev, ...patch }
      if (next.virtualMw > next.maxVirtualMw) {
        next.virtualMw = next.maxVirtualMw
      }
      if (next.virtualMw < 0) {
        next.virtualMw = 0
      }
      return next
    })

  const resetSimulation = () => {
    setPnl({
      energy: 0,
      ancillary: 0,
      virtual: 0,
      degradation: 0,
      forecastError: 0,
    })
    setCurrentStep(0)
  }

  const applyPreset = (preset: (typeof scenarioPresets)[number]) => {
    setActivePresetId(preset.id)
    updateControls({ ...preset.settings })
    resetSimulation()
  }

  const confidenceLabel = getConfidenceLabel(controls.confidenceIndex)
  const virtualScore =
    decision.strategyScores.find((item) => item.type === 'Virtual')?.score ?? 0
  const virtualHaircut =
    (1 - decision.confidenceScore) * 100 + (controls.forecastFragile ? 10 : 0)

  const breakCycleDrag =
    100 + (controls.alwaysChaseSpread ? 40 : 0) + (controls.neverHoldScarcity ? 20 : 0)
  const breakPnlDrag =
    100 -
    (controls.ignoreConfidence ? 20 : 0) -
    (controls.alwaysChaseSpread ? 15 : 0) -
    (controls.neverHoldScarcity ? 10 : 0)
  const breakDrawdown =
    100 +
    (controls.ignoreConfidence ? 25 : 0) +
    (controls.neverHoldScarcity ? 20 : 0)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>ERCOT Merchant BESS Optimization Simulator</h1>
          <p>
            Autobidder-class, vendor-neutral simulator for executives to see how
            real optimizers turn forecasts into bids, dispatch, and P&L.
          </p>
        </div>
        <div className="header-toggles">
          <ToggleSwitch
            label={controls.rtcMode ? 'RTC+B (co-optimized)' : 'Pre-RTC+B (simplified)'}
            checked={controls.rtcMode}
            onChange={(checked) => updateControls({ rtcMode: checked })}
          />
          <ToggleSwitch
            label={controls.intervalMode === '5m' ? '5-minute feel' : '15-minute steps'}
            checked={controls.intervalMode === '5m'}
            onChange={(checked) => {
              setCurrentStep(0)
              updateControls({ intervalMode: checked ? '5m' : '15m' })
            }}
          />
        </div>
      </header>

      <div className="loop-card">
        <span>Forecast</span>
        <span className="loop-arrow">-&gt;</span>
        <span>Decision</span>
        <span className="loop-arrow">-&gt;</span>
        <span>Bid</span>
        <span className="loop-arrow">-&gt;</span>
        <span>Dispatch</span>
        <span className="loop-arrow">-&gt;</span>
        <span>P&amp;L</span>
      </div>

      <div className="app-grid">
        <aside className="panel controls-panel">
          <div className="panel-title">Controls</div>
          <div className="section">
            <div className="section-title">Market</div>
            <ControlSlider
              label="Expected DA spread"
              value={controls.expectedDASpread}
              min={10}
              max={90}
              onChange={(value) => updateControls({ expectedDASpread: value })}
              hint="Low <-> High"
            />
            <ControlSlider
              label="Expected RT volatility"
              value={controls.expectedRTVolatility}
              min={10}
              max={90}
              onChange={(value) => updateControls({ expectedRTVolatility: value })}
              hint="Low <-> High"
            />
            <ControlSlider
              label="Ancillary price level"
              value={controls.ancillaryPriceLevel}
              min={10}
              max={100}
              onChange={(value) => updateControls({ ancillaryPriceLevel: value })}
              hint="Low <-> High"
            />
            <ControlSlider
              label="Scarcity likelihood"
              value={controls.scarcityLikelihood}
              min={0}
              max={100}
              onChange={(value) => updateControls({ scarcityLikelihood: value })}
              unit="%"
            />
          </div>

          <div className="section">
            <div className="section-title">Forecast Confidence</div>
            <ControlSlider
              label="Confidence"
              value={controls.confidenceIndex}
              min={0}
              max={2}
              step={1}
              displayValue={confidenceLabel}
              onChange={(value) => updateControls({ confidenceIndex: value })}
            />
            <ControlSlider
              label="Uncertainty band width"
              value={controls.bandWidth}
              min={10}
              max={90}
              onChange={(value) => updateControls({ bandWidth: value })}
            />
            <ToggleSwitch
              label="Forecast fragile (regime shift)"
              checked={controls.forecastFragile}
              onChange={(checked) => updateControls({ forecastFragile: checked })}
            />
          </div>

          <div className="section">
            <div className="section-title">Battery</div>
            <ControlSlider
              label="SOC"
              value={controls.soc}
              min={0}
              max={100}
              onChange={(value) => updateControls({ soc: value })}
              unit="%"
            />
            <ControlSlider
              label="Power"
              value={controls.powerMw}
              min={20}
              max={300}
              step={10}
              onChange={(value) => updateControls({ powerMw: value })}
              unit=" MW"
            />
            <ControlSlider
              label="Duration"
              value={controls.durationHours}
              min={2}
              max={4}
              step={2}
              displayValue={`${controls.durationHours}h`}
              onChange={(value) => updateControls({ durationHours: value })}
            />
            <ControlSlider
              label="Charge/Discharge efficiency"
              value={Math.round(controls.efficiency * 100)}
              min={80}
              max={98}
              onChange={(value) =>
                updateControls({ efficiency: Number((value / 100).toFixed(2)) })
              }
              unit="%"
            />
            <ControlSlider
              label="Min SOC"
              value={controls.minSoc}
              min={0}
              max={30}
              onChange={(value) => updateControls({ minSoc: value })}
              unit="%"
            />
            <ControlSlider
              label="Max SOC"
              value={controls.maxSoc}
              min={70}
              max={100}
              onChange={(value) => updateControls({ maxSoc: value })}
              unit="%"
            />
            <ControlSlider
              label="Cycle budget remaining (daily)"
              value={Number(controls.cycleBudgetDaily.toFixed(2))}
              min={0}
              max={3}
              step={0.1}
              onChange={(value) => updateControls({ cycleBudgetDaily: value })}
            />
            <ControlSlider
              label="Cycle budget remaining (annual)"
              value={controls.cycleBudgetAnnual}
              min={0}
              max={365}
              step={5}
              onChange={(value) => updateControls({ cycleBudgetAnnual: value })}
            />
            <ControlSlider
              label="Degradation sensitivity"
              value={controls.degradationSensitivity}
              min={0}
              max={100}
              onChange={(value) => updateControls({ degradationSensitivity: value })}
              hint="Conservative <-> Aggressive"
            />
            <ControlSlider
              label="Ramp / response speed"
              value={controls.rampSpeed}
              min={40}
              max={100}
              onChange={(value) => updateControls({ rampSpeed: value })}
            />
          </div>

          <div className="section">
            <div className="section-title">Risk Controls (Merchant Discipline)</div>
            <ControlSlider
              label="Max daily cycles"
              value={controls.maxDailyCycles}
              min={0.5}
              max={3}
              step={0.1}
              onChange={(value) => updateControls({ maxDailyCycles: value })}
            />
            <ControlSlider
              label="Max virtual MW exposure"
              value={controls.maxVirtualMw}
              min={20}
              max={200}
              step={10}
              onChange={(value) => updateControls({ maxVirtualMw: value })}
            />
            <ControlSlider
              label="Virtual MW exposure"
              value={controls.virtualMw}
              min={0}
              max={controls.maxVirtualMw}
              step={5}
              onChange={(value) => updateControls({ virtualMw: value })}
            />
            <ToggleSwitch
              label="Loss limit / stop-out"
              checked={controls.lossLimitEnabled}
              onChange={(checked) => updateControls({ lossLimitEnabled: checked })}
            />
            <ToggleSwitch
              label="Protect scarcity (reserve SOC)"
              checked={controls.protectScarcity}
              onChange={(checked) => updateControls({ protectScarcity: checked })}
            />
            <ControlSlider
              label="Reserved SOC"
              value={controls.reservedSoc}
              min={0}
              max={50}
              onChange={(value) => updateControls({ reservedSoc: value })}
              unit="%"
            />
            <ToggleSwitch
              label="Use virtuals to preserve battery life"
              checked={controls.useVirtualsToPreserveBatteryLife}
              onChange={(checked) =>
                updateControls({ useVirtualsToPreserveBatteryLife: checked })
              }
            />
            <ToggleSwitch
              label="Show scarcity window"
              checked={controls.showScarcityWindow}
              onChange={(checked) => updateControls({ showScarcityWindow: checked })}
            />
          </div>

          <div className="section break-section">
            <div className="section-title">Break It Buttons</div>
            <ToggleSwitch
              label="Ignore confidence"
              checked={controls.ignoreConfidence}
              onChange={(checked) => updateControls({ ignoreConfidence: checked })}
            />
            <ToggleSwitch
              label="Always chase spread (over-cycle)"
              checked={controls.alwaysChaseSpread}
              onChange={(checked) => updateControls({ alwaysChaseSpread: checked })}
            />
            <ToggleSwitch
              label="Never hold for scarcity"
              checked={controls.neverHoldScarcity}
              onChange={(checked) => updateControls({ neverHoldScarcity: checked })}
            />
          </div>
        </aside>

        <main className="panel main-panel">
          <ForecastChart
            data={forecast}
            showScarcity={controls.showScarcityWindow}
            scarcityWindow={{ start: 17.5, end: 21.5 }}
          />

          <ValueBars items={decision.strategyScores} selected={decision.bestStrategy} />

          <DecisionEngine
            bestAction={decision.bestAction}
            bestStrategy={decision.bestStrategy}
            topTwo={decision.topTwo}
            confidenceLabel={decision.confidenceLabel}
            traceNote={decision.rationale.traceNote}
            rtcMode={controls.rtcMode}
          />

          <div className="main-row">
            <ConstraintGauges
              soc={controls.soc}
              minSoc={controls.minSoc}
              maxSoc={controls.maxSoc}
              reservedSoc={controls.reservedSoc}
              protectScarcity={controls.protectScarcity}
              cycleBudgetDaily={controls.cycleBudgetDaily}
              cycleBudgetAnnual={controls.cycleBudgetAnnual}
              maxDailyCycles={controls.maxDailyCycles}
              maxAnnualCycles={365}
              asHeadroom={decision.asHeadroom}
              virtualMw={controls.virtualMw}
              maxVirtualMw={controls.maxVirtualMw}
            />
            <div className="module-stack">
              <VirtualsModule
                virtualDirection={decision.virtualDirection}
                expectedValue={virtualScore}
                riskHaircut={virtualHaircut}
                virtualMw={controls.virtualMw}
                maxVirtualMw={controls.maxVirtualMw}
                useVirtualsToPreserveBatteryLife={
                  controls.useVirtualsToPreserveBatteryLife
                }
              />
              <AncillaryModule
                ancillaryPriceLevel={controls.ancillaryPriceLevel}
                asHeadroom={decision.asHeadroom}
                rampSpeed={controls.rampSpeed}
                selected={decision.bestStrategy === 'Ancillary'}
                rtcMode={controls.rtcMode}
              />
            </div>
          </div>

          <ScenarioPresets
            presets={scenarioPresets}
            activeId={activePresetId}
            onSelect={applyPreset}
          />
        </main>

        <aside className="panel rationale-panel">
          <RationalePanel rationale={decision.rationale} />
          <PnLAttribution
            energy={pnl.energy}
            ancillary={pnl.ancillary}
            virtual={pnl.virtual}
            degradation={pnl.degradation}
            forecastError={pnl.forecastError}
          />
          <BreakItPanel
            ignoreConfidence={controls.ignoreConfidence}
            alwaysChaseSpread={controls.alwaysChaseSpread}
            neverHoldScarcity={controls.neverHoldScarcity}
            cycleDrag={breakCycleDrag}
            pnlDrag={breakPnlDrag}
            drawdownRisk={breakDrawdown}
          />
        </aside>
      </div>
    </div>
  )
}

export default App
