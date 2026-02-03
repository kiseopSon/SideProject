package com.mydressroom.scalper.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class RiskCalculatorTest {
  @Test
  fun long_calculates_sl_tp_and_quantity() {
    val out = RiskCalculator.calculate(
      RiskInputs(
        side = Side.LONG,
        entryPrice = Money(10_000.0),
        stopLossPercent = 0.01, // -1%
        rewardToRisk = 1.5,
        maxLossPerTrade = Money(30_000.0),
      )
    )

    assertEquals(9_900.0, out.stopLossPrice.value, 0.0001)
    assertEquals(10_150.0, out.takeProfitPrice.value, 0.0001)
    // lossPerShare = 100 -> 30000/100 = 300주
    assertEquals(300L, out.quantity)
    assertEquals(100.0, out.lossPerShare.value, 0.0001)
    assertEquals(150.0, out.profitPerShare.value, 0.0001)
  }

  @Test
  fun short_calculates_sl_tp_and_quantity() {
    val out = RiskCalculator.calculate(
      RiskInputs(
        side = Side.SHORT,
        entryPrice = Money(10_000.0),
        stopLossPercent = 0.01, // +1% 손절
        rewardToRisk = 2.0,
        maxLossPerTrade = Money(10_000.0),
      )
    )

    assertEquals(10_100.0, out.stopLossPrice.value, 0.0001)
    assertEquals(9_800.0, out.takeProfitPrice.value, 0.0001)
    // lossPerShare = 100 -> 10000/100 = 100주
    assertEquals(100L, out.quantity)
  }

  @Test
  fun mark_to_market_works() {
    val pnl = RiskCalculator.markToMarket(
      side = Side.LONG,
      entryPrice = Money(10_000.0),
      currentPrice = Money(10_050.0),
      quantity = 10,
    )
    assertEquals(500.0, pnl.value, 0.0001)
    assertTrue(pnl.value > 0)
  }
}

