allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    val p = this
    fun applyFix(proj: Project) {
        if (proj.hasProperty("android")) {
            val android = proj.extensions.getByName("android") as com.android.build.gradle.BaseExtension
            android.compileSdkVersion(36)
            if (proj.name == "blue_thermal_printer") {
                android.namespace = "id.kakzaki.blue_thermal_printer"
            }
        }
    }

    if (p.state.executed) {
        applyFix(p)
    } else {
        p.afterEvaluate {
            applyFix(p)
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
