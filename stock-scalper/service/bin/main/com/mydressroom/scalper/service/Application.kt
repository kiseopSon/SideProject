package com.mydressroom.scalper.service

import com.mydressroom.scalper.domain.Money
import com.mydressroom.scalper.domain.RiskCalculator
import com.mydressroom.scalper.domain.RiskInputs
import com.mydressroom.scalper.domain.Side
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.plugins.statuspages.exception
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.Frame
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.slf4j.event.Level
import kotlin.math.roundToInt

val kisApiClient = KisApiClient()

fun main() {
  val port = (System.getenv("PORT") ?: "8080").toIntOrNull() ?: 8080
  embeddedServer(Netty, port = port, host = "0.0.0.0") {
    module()
  }.start(wait = true)
}

fun Application.module() {
  install(CallLogging) {
    level = Level.INFO
  }
  install(WebSockets)
  install(ContentNegotiation) {
    json(
      Json {
        prettyPrint = true
        isLenient = true
        ignoreUnknownKeys = true
      }
    )
  }
  install(StatusPages) {
    exception<IllegalArgumentException> { call, cause ->
      call.respond(
        HttpStatusCode.BadRequest,
        ErrorResponse(message = cause.message ?: "Bad request")
      )
    }
    exception<Throwable> { call, cause ->
      call.respond(
        HttpStatusCode.InternalServerError,
        ErrorResponse(message = "Internal error: ${cause::class.simpleName}")
      )
    }
  }

  routing {
    get("/") {
      call.respondText(
        """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Stock Scalper API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; margin-right: 10px; }
            .get { background: #4CAF50; color: white; }
            .post { background: #2196F3; color: white; }
            code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>📈 Stock Scalper API</h1>
          <p>국내 단타 트레이더를 위한 리스크 관리 API 서비스</p>
          
          <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/health</strong>
            <p>서버 상태 확인</p>
            <code>curl http://127.0.0.1:8080/health</code>
          </div>
          
          <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/risk/calc</strong>
            <p>익절/손절/수량 계산</p>
            <pre>{
  "side": "LONG",
  "entryPrice": 10000.0,
  "stopLossPercent": 0.01,
  "rewardToRisk": 1.5,
  "maxLossPerTrade": 30000.0
}</pre>
          </div>
          
          <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/risk/pnl</strong>
            <p>현재가 기준 손익 계산</p>
            <pre>{
  "side": "LONG",
  "entryPrice": 10000.0,
  "currentPrice": 10050.0,
  "quantity": 300
}</pre>
          </div>
          
          <p><small>서버 실행 중: <code>http://127.0.0.1:8080</code></small></p>
        </body>
        </html>
        """.trimIndent(),
        ContentType.Text.Html
      )
    }

    get("/health") {
      call.respond(mapOf("ok" to true))
    }

    get("/api/stocks") {
      // 주요 한국 주식 종목 목록
      val stockCodes = listOf(
        "005930", "000660", "035420", "035720", "051910",
        "006400", "028260", "207940", "068270", "012330",
        "005380", "003670", "105560", "055550", "032830"
      )
      
      val stockNames = mapOf(
        "005930" to "삼성전자",
        "000660" to "SK하이닉스",
        "035420" to "NAVER",
        "035720" to "카카오",
        "051910" to "LG화학",
        "006400" to "삼성SDI",
        "028260" to "삼성물산",
        "207940" to "삼성바이오로직스",
        "068270" to "셀트리온",
        "012330" to "현대모비스",
        "005380" to "현대차",
        "003670" to "POSCO홀딩스",
        "105560" to "KB금융",
        "055550" to "신한지주",
        "032830" to "삼성생명"
      )
      
      val stocks = if (kisApiClient.isConfigured()) {
        // 실제 API로 현재가 조회
        val prices = kisApiClient.getCurrentPrices(stockCodes)
        stockCodes.map { code ->
          StockInfo(
            code = code,
            name = stockNames[code] ?: code,
            currentPrice = prices[code] ?: 0.0
          )
        }
      } else {
        // API 키가 없으면 기본값 사용 (실제 가격이 아님)
        stockCodes.map { code ->
          StockInfo(
            code = code,
            name = stockNames[code] ?: code,
            currentPrice = 0.0 // API 키 설정 필요
          )
        }
      }
      
      call.respond(stocks)
    }
    
    get("/api/price/{code}") {
      val code = call.parameters["code"] ?: return@get call.respond(
        HttpStatusCode.BadRequest,
        ErrorResponse("종목코드가 필요합니다")
      )
      
      if (!kisApiClient.isConfigured()) {
        call.respond(
          HttpStatusCode.ServiceUnavailable,
          ErrorResponse("한국투자증권 API 키가 설정되지 않았습니다. KIS_APP_KEY, KIS_APP_SECRET 환경변수를 설정하세요.")
        )
        return@get
      }
      
      val price = kisApiClient.getCurrentPrice(code)
      if (price == null) {
        call.respond(
          HttpStatusCode.NotFound,
          ErrorResponse("주가를 조회할 수 없습니다")
        )
        return@get
      }
      
      call.respond(mapOf("code" to code, "price" to price))
    }

    get("/app") {
      val html = javaClass.classLoader.getResourceAsStream("app.html")?.reader()?.readText()
        ?: error("app.html not found")
      call.respondText(html, ContentType.Text.Html)
    }

    webSocket("/ws/price") {
      val inputs = call.request.queryParameters
      val basePrice = inputs["base"]?.toDoubleOrNull() ?: 10000.0
      val stockCode = inputs["code"]
      
      val stockNames = mapOf(
        "005930" to "삼성전자", "000660" to "SK하이닉스", "035420" to "NAVER",
        "035720" to "카카오", "051910" to "LG화학", "006400" to "삼성SDI",
        "028260" to "삼성물산", "207940" to "삼성바이오로직스", "068270" to "셀트리온",
        "012330" to "현대모비스", "005380" to "현대차", "003670" to "POSCO홀딩스",
        "105560" to "KB금융", "055550" to "신한지주", "032830" to "삼성생명"
      )
      
      val stockName = stockCode?.let { stockNames[it] }
      
      var lastRealPrice: Double? = null
      var currentPrice = basePrice
      
      try {
        while (true) {
          // 실제 API로 주가 조회 (API 키가 설정된 경우)
          if (kisApiClient.isConfigured() && stockCode != null) {
            val realPrice = kisApiClient.getCurrentPrice(stockCode)
            if (realPrice != null) {
              lastRealPrice = realPrice
              currentPrice = realPrice
            } else if (lastRealPrice != null) {
              // API 호출 실패 시 마지막 가격 사용
              currentPrice = lastRealPrice
            }
          } else {
            // API 키가 없으면 시뮬레이션 (basePrice 기준 랜덤 워크)
            val change = (Math.random() - 0.5) * 0.02 // -1% ~ +1% 변동
            currentPrice *= (1.0 + change)
            
            // basePrice 기준으로 너무 멀어지지 않도록
            if (Math.abs(currentPrice - basePrice) / basePrice > 0.05) {
              currentPrice = basePrice * (1.0 + (Math.random() - 0.5) * 0.1)
            }
          }
          
          val priceData = PriceUpdate(
            price = currentPrice,
            timestamp = System.currentTimeMillis(),
            stockCode = stockCode,
            stockName = stockName
          )
          
          outgoing.send(Frame.Text(json.encodeToString(PriceUpdate.serializer(), priceData)))
          
          // 실제 API 사용 시 호출 제한 고려 (1초마다)
          // 시뮬레이션 시 0.5초마다
          delay(if (kisApiClient.isConfigured()) 1000 else 500)
        }
      } catch (e: Exception) {
        // 연결 종료
      }
    }

    post("/risk/calc") {
      val req = call.receive<RiskCalcRequest>()
      val out = RiskCalculator.calculate(
        RiskInputs(
          side = req.side.toDomain(),
          entryPrice = Money(req.entryPrice),
          stopLossPercent = req.stopLossPercent,
          rewardToRisk = req.rewardToRisk,
          maxLossPerTrade = Money(req.maxLossPerTrade),
        )
      )

      call.respond(
        RiskCalcResponse(
          side = req.side,
          entryPrice = req.entryPrice,
          stopLossPercent = req.stopLossPercent,
          stopLossPercentDisplay = percentDisplay(req.stopLossPercent),
          rewardToRisk = req.rewardToRisk,
          maxLossPerTrade = req.maxLossPerTrade,
          stopLossPrice = out.stopLossPrice.value,
          takeProfitPrice = out.takeProfitPrice.value,
          quantity = out.quantity,
          lossPerShare = out.lossPerShare.value,
          profitPerShare = out.profitPerShare.value,
        )
      )
    }

    post("/risk/pnl") {
      val req = call.receive<PnlRequest>()
      val pnl = RiskCalculator.markToMarket(
        side = req.side.toDomain(),
        entryPrice = Money(req.entryPrice),
        currentPrice = Money(req.currentPrice),
        quantity = req.quantity,
      )
      call.respond(
        PnlResponse(
          side = req.side,
          entryPrice = req.entryPrice,
          currentPrice = req.currentPrice,
          quantity = req.quantity,
          pnl = pnl.value,
        )
      )
    }
  }
}

@Serializable
data class ErrorResponse(
  val message: String,
)

@Serializable
enum class ApiSide {
  @SerialName("LONG")
  LONG,

  @SerialName("SHORT")
  SHORT;

  fun toDomain(): Side = when (this) {
    LONG -> Side.LONG
    SHORT -> Side.SHORT
  }
}

@Serializable
data class RiskCalcRequest(
  val side: ApiSide,
  /** 체결가(원) */
  val entryPrice: Double,
  /** 손절폭(비율). 예) 1% = 0.01 */
  val stopLossPercent: Double,
  /** 목표 R:R */
  val rewardToRisk: Double,
  /** 1 트레이드 최대 손실(원) */
  val maxLossPerTrade: Double,
)

@Serializable
data class RiskCalcResponse(
  val side: ApiSide,
  val entryPrice: Double,
  /** 손절폭(비율). 예) 1% = 0.01 */
  val stopLossPercent: Double,
  /** 손절폭(%). 예) 1% = "1%" */
  val stopLossPercentDisplay: String,
  val rewardToRisk: Double,
  val maxLossPerTrade: Double,

  val stopLossPrice: Double,
  val takeProfitPrice: Double,
  val quantity: Long,
  val lossPerShare: Double,
  val profitPerShare: Double,
)

@Serializable
data class PnlRequest(
  val side: ApiSide,
  val entryPrice: Double,
  val currentPrice: Double,
  val quantity: Long,
)

@Serializable
data class PnlResponse(
  val side: ApiSide,
  val entryPrice: Double,
  val currentPrice: Double,
  val quantity: Long,
  val pnl: Double,
)

@Serializable
data class StockInfo(
  val code: String,
  val name: String,
  val currentPrice: Double,
)

@Serializable
data class PriceUpdate(
  val price: Double,
  val timestamp: Long,
  val stockCode: String? = null,
  val stockName: String? = null,
)

private val json = Json {
  prettyPrint = false
  isLenient = true
  ignoreUnknownKeys = true
}

private fun percentDisplay(ratio: Double): String {
  // 0.007 -> 0.7%
  val p = ratio * 100.0
  val rounded = (p * 100).roundToInt() / 100.0
  return "${rounded}%"
}

