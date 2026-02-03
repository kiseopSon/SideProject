package com.mydressroom.scalper.domain

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * 단타용 계산은 "실시간 시세"보다 "손절/익절/수량을 즉시 확정"하는 게 핵심이라
 * 공통 로직(shared)에 넣어 Android/iOS에서 동일하게 사용한다.
 */

@JvmInline
value class Money(val value: Double) {
  init {
    require(value.isFinite()) { "Money must be finite." }
  }
}

enum class Side { LONG, SHORT }

data class RiskInputs(
  val side: Side,
  /** 체결가(진입가) */
  val entryPrice: Money,
  /** 손절폭(%) 예: 0.7% => 0.007 */
  val stopLossPercent: Double,
  /** 목표 R:R (예: 1.5) */
  val rewardToRisk: Double,
  /** 1 트레이드 최대 손실(원) */
  val maxLossPerTrade: Money,
)

data class RiskOutputs(
  val stopLossPrice: Money,
  val takeProfitPrice: Money,
  /** 권장 수량(주) */
  val quantity: Long,
  /** 1주 손실(원) */
  val lossPerShare: Money,
  /** 1주 이익(원) */
  val profitPerShare: Money,
)

object RiskCalculator {
  /**
   * 단타 기본(롱/숏 모두) 익절/손절/수량 계산.
   *
   * 제약:
   * - stopLossPercent: (0, 1) 범위 권장
   * - rewardToRisk: > 0
   * - entryPrice, maxLossPerTrade: > 0
   */
  fun calculate(inputs: RiskInputs): RiskOutputs {
    require(inputs.entryPrice.value > 0) { "entryPrice must be > 0" }
    require(inputs.maxLossPerTrade.value > 0) { "maxLossPerTrade must be > 0" }
    require(inputs.stopLossPercent > 0 && inputs.stopLossPercent < 1) { "stopLossPercent must be in (0,1)" }
    require(inputs.rewardToRisk > 0) { "rewardToRisk must be > 0" }

    val e = inputs.entryPrice.value
    val sl = when (inputs.side) {
      Side.LONG -> e * (1.0 - inputs.stopLossPercent)
      Side.SHORT -> e * (1.0 + inputs.stopLossPercent)
    }

    val lossPerShare = max(0.0, when (inputs.side) {
      Side.LONG -> e - sl
      Side.SHORT -> sl - e
    })

    // 목표 이익 = 손실 * R:R
    val profitPerShare = lossPerShare * inputs.rewardToRisk
    val tp = when (inputs.side) {
      Side.LONG -> e + profitPerShare
      Side.SHORT -> e - profitPerShare
    }

    val q = if (lossPerShare <= 0.0) {
      0L
    } else {
      floor(inputs.maxLossPerTrade.value / lossPerShare).toLong().coerceAtLeast(0L)
    }

    return RiskOutputs(
      stopLossPrice = Money(sl),
      takeProfitPrice = Money(tp),
      quantity = q,
      lossPerShare = Money(lossPerShare),
      profitPerShare = Money(profitPerShare),
    )
  }

  /**
   * 현재가 기준 진행 상황(손익/도달 여부).
   * 실시간 시세는 한국투자증권 OpenAPI로 가져오되, 계산은 클라이언트에서 즉시 한다.
   */
  fun markToMarket(
    side: Side,
    entryPrice: Money,
    currentPrice: Money,
    quantity: Long,
  ): Money {
    val e = entryPrice.value
    val p = currentPrice.value
    val q = max(0L, quantity)
    val pnlPerShare = when (side) {
      Side.LONG -> p - e
      Side.SHORT -> e - p
    }
    return Money(pnlPerShare * q.toDouble())
  }

  fun clampPrice(price: Money, minPrice: Money = Money(0.0), maxPrice: Money = Money(Double.POSITIVE_INFINITY)): Money {
    return Money(min(max(price.value, minPrice.value), maxPrice.value))
  }
}

