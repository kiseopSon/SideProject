package com.mydressroom.scalper.service

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.delay
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * 한국투자증권 OpenAPI 클라이언트
 * 
 * 환경변수 설정 필요:
 * - KIS_APP_KEY: 앱 키
 * - KIS_APP_SECRET: 앱 시크릿
 * - KIS_ACCOUNT_NO: 계좌번호 (선택)
 */
class KisApiClient {
  private val appKey = System.getenv("KIS_APP_KEY") ?: ""
  private val appSecret = System.getenv("KIS_APP_SECRET") ?: ""
  private val baseUrl = System.getenv("KIS_BASE_URL") ?: "https://openapi.koreainvestment.com"
  
  private val client = HttpClient(CIO) {
    install(ContentNegotiation) {
      json(Json {
        ignoreUnknownKeys = true
        isLenient = true
      })
    }
  }
  
  private var accessToken: String? = null
  private var tokenExpiresAt: Long = 0
  
  /**
   * OAuth 토큰 발급
   */
  suspend fun getAccessToken(): String? {
    if (appKey.isEmpty() || appSecret.isEmpty()) {
      return null
    }
    
    // 토큰이 아직 유효하면 재사용
    if (accessToken != null && System.currentTimeMillis() < tokenExpiresAt) {
      return accessToken
    }
    
    try {
      val response = client.post("$baseUrl/oauth2/tokenP") {
        contentType(ContentType.Application.Json)
        setBody(mapOf(
          "grant_type" to "client_credentials",
          "appkey" to appKey,
          "appsecret" to appSecret
        ))
      }
      
      val tokenResponse = response.body<TokenResponse>()
      accessToken = tokenResponse.access_token
      // 토큰 만료 시간 설정 (보통 24시간, 안전하게 23시간으로 설정)
      tokenExpiresAt = System.currentTimeMillis() + (23 * 60 * 60 * 1000)
      
      return accessToken
    } catch (e: Exception) {
      println("토큰 발급 실패: ${e.message}")
      return null
    }
  }
  
  /**
   * 주식 현재가 조회
   * @param stockCode 종목코드 (6자리)
   */
  suspend fun getCurrentPrice(stockCode: String): Double? {
    val token = getAccessToken() ?: return null
    
    try {
      val response = client.get("$baseUrl/uapi/domestic-stock/v1/quotations/inquire-price") {
        headers {
          append("Authorization", "Bearer $token")
          append("appkey", appKey)
          append("appsecret", appSecret)
          append("tr_id", "FHKST01010100")
        }
        parameter("fid_cond_mrkt_div_code", "J")
        parameter("fid_input_iscd", stockCode)
      }
      
      val priceResponse = response.body<PriceResponse>()
      return priceResponse.output.stck_prpr?.toDoubleOrNull()
    } catch (e: Exception) {
      println("주가 조회 실패 ($stockCode): ${e.message}")
      return null
    }
  }
  
  /**
   * 여러 종목의 현재가 조회
   */
  suspend fun getCurrentPrices(stockCodes: List<String>): Map<String, Double> {
    val prices = mutableMapOf<String, Double>()
    
    for (code in stockCodes) {
      val price = getCurrentPrice(code)
      if (price != null) {
        prices[code] = price
      }
      // API 호출 제한 방지를 위한 딜레이
      delay(100)
    }
    
    return prices
  }
  
  fun isConfigured(): Boolean {
    return appKey.isNotEmpty() && appSecret.isNotEmpty()
  }
}

@Serializable
data class TokenResponse(
  @SerialName("access_token")
  val access_token: String,
  @SerialName("token_type")
  val token_type: String,
  @SerialName("expires_in")
  val expires_in: Int,
)

@Serializable
data class PriceResponse(
  val output: PriceOutput,
)

@Serializable
data class PriceOutput(
  @SerialName("stck_prpr")
  val stck_prpr: String? = null,
  @SerialName("prdy_vrss")
  val prdy_vrss: String? = null,
  @SerialName("prdy_vrss_sign")
  val prdy_vrss_sign: String? = null,
)
