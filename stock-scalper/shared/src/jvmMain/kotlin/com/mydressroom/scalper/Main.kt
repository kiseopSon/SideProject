package com.mydressroom.scalper

import com.mydressroom.scalper.domain.Money
import com.mydressroom.scalper.domain.RiskCalculator
import com.mydressroom.scalper.domain.RiskInputs
import com.mydressroom.scalper.domain.Side

fun main() {
    println("=".repeat(60))
    println("Stock Scalper - 리스크 계산 데모")
    println("=".repeat(60))
    println()

    // 롱 포지션 예제
    println("롱 포지션 예제")
    println("-".repeat(60))
    val longInputs = RiskInputs(
        side = Side.LONG,
        entryPrice = Money(10_000.0),
        stopLossPercent = 0.01, // -1%
        rewardToRisk = 1.5,
        maxLossPerTrade = Money(30_000.0),
    )
    val longOutputs = RiskCalculator.calculate(longInputs)
    println("체결가: ${longInputs.entryPrice.value}원")
    println("손절폭: ${(longInputs.stopLossPercent * 100.0)}%")
    println("손절가: ${longOutputs.stopLossPrice.value}원")
    println("익절가: ${longOutputs.takeProfitPrice.value}원")
    println("권장 수량: ${longOutputs.quantity}주")
    println("1주당 손실: ${longOutputs.lossPerShare.value}원")
    println("1주당 이익: ${longOutputs.profitPerShare.value}원")
    println()

    // 현재가 기준 손익 계산
    val currentPrice1 = Money(10_050.0)
    val pnl1 = RiskCalculator.markToMarket(
        side = Side.LONG,
        entryPrice = longInputs.entryPrice,
        currentPrice = currentPrice1,
        quantity = longOutputs.quantity,
    )
    println("현재가: ${currentPrice1.value}원 → 손익: ${pnl1.value}원")
    println()

    // 숏 포지션 예제
    println("숏 포지션 예제")
    println("-".repeat(60))
    val shortInputs = RiskInputs(
        side = Side.SHORT,
        entryPrice = Money(10_000.0),
        stopLossPercent = 0.01, // +1% 손절
        rewardToRisk = 2.0,
        maxLossPerTrade = Money(10_000.0),
    )
    val shortOutputs = RiskCalculator.calculate(shortInputs)
    println("체결가: ${shortInputs.entryPrice.value}원")
    println("손절폭: ${(shortInputs.stopLossPercent * 100.0)}%")
    println("손절가: ${shortOutputs.stopLossPrice.value}원")
    println("익절가: ${shortOutputs.takeProfitPrice.value}원")
    println("권장 수량: ${shortOutputs.quantity}주")
    println("1주당 손실: ${shortOutputs.lossPerShare.value}원")
    println("1주당 이익: ${shortOutputs.profitPerShare.value}원")
    println()

    // 현재가 기준 손익 계산
    val currentPrice2 = Money(9_950.0)
    val pnl2 = RiskCalculator.markToMarket(
        side = Side.SHORT,
        entryPrice = shortInputs.entryPrice,
        currentPrice = currentPrice2,
        quantity = shortOutputs.quantity,
    )
    println("현재가: ${currentPrice2.value}원 → 손익: ${pnl2.value}원")
    println()

    println("=".repeat(60))
    println("✅ 서비스 실행 완료!")
    println("=".repeat(60))
}
