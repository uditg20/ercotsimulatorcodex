# ERCOT Merchant BESS Optimization Simulator

Executive-focused, ERCOT-specific simulator that teaches how merchant battery
optimizers decide between physical dispatch, ancillary services, DA virtuals,
and holding SOC for scarcity.

## Run locally

```bash
npm install
npm run dev
```

## What you can learn in 5 minutes

- Forecast → decision → bid → dispatch → P&L (closed loop)
- Why virtuals can beat cycling when confidence is high
- Why holding SOC for scarcity is sometimes the dominant option
- Why ancillary services can dominate energy on a risk-adjusted basis
- How forecast confidence changes aggressiveness
- Why cycle budget and degradation are the true cost of dispatch
- What changes under RTC+B co-optimization

## Key UI components

- ForecastChart (DA, RT, forecast band, scarcity window)
- ValueBars (physical vs AS vs virtuals vs hold)
- ConstraintGauges (SOC, cycle budget, AS headroom, virtual exposure)
- DecisionEngine (animated action + decision trace)
- RationalePanel (plain-English "why")
- ScenarioPresets (executive playbooks)
- PnLAttribution (energy, AS, virtuals, degradation, forecast error)

## Implementation notes

- Synthetic price generator with controllable spread/volatility/scarcity
- Forecast generator with confidence band width
- Lightweight optimizer-like logic (no exposed equations)
- 15-minute dispatch loop with optional 5-minute feel
