plugins {
  alias(libs.plugins.kotlin.multiplatform)
  alias(libs.plugins.kotlin.serialization)
}

kotlin {
  jvm() {
    withJava()
  }

  sourceSets {
    val jvmMain by getting {
      dependsOn(commonMain.get())
    }
    commonMain {
      dependencies {
        implementation(libs.kotlinx.coroutines.core)
        implementation(libs.ktor.client.core)
        implementation(libs.ktor.client.content.negotiation)
        implementation(libs.ktor.serialization.kotlinx.json)
      }
    }
    commonTest {
      dependencies {
        implementation(kotlin("test"))
      }
    }
  }
}

tasks.register<JavaExec>("run") {
  group = "application"
  description = "Run the Stock Scalper demo"
  val jvmMainCompilation = kotlin.jvm().compilations.getByName("main")
  classpath = jvmMainCompilation.runtimeDependencyFiles + files(jvmMainCompilation.output.classesDirs)
  mainClass.set("com.mydressroom.scalper.MainKt")
  dependsOn("jvmMainClasses")
}

