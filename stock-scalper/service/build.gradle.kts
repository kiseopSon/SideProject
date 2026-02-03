plugins {
  alias(libs.plugins.kotlin.jvm)
  alias(libs.plugins.kotlin.serialization)
  application
}

dependencies {
  implementation(projects.shared)

  implementation(libs.ktor.server.core)
  implementation(libs.ktor.server.netty)
  implementation(libs.ktor.server.content.negotiation)
  implementation(libs.ktor.server.call.logging)
  implementation(libs.ktor.server.status.pages)
  implementation(libs.ktor.server.websockets)
  implementation(libs.ktor.serialization.kotlinx.json)
  
  // 한국투자증권 API 호출용
  implementation(libs.ktor.client.core)
  implementation(libs.ktor.client.cio)
  implementation(libs.ktor.client.content.negotiation)
  implementation(libs.ktor.serialization.kotlinx.json)
}

application {
  mainClass.set("com.mydressroom.scalper.service.ApplicationKt")
}

tasks.named<JavaExec>("run") {
  // Windows 콘솔 한글 깨짐 방지(가능한 범위)
  jvmArgs("-Dfile.encoding=UTF-8")
}

