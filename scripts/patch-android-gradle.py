import re
import sys

build_file = sys.argv[1]

with open(build_file) as f:
    content = f.read()

if 'import java.io.FileInputStream' not in content:
    content = 'import java.io.FileInputStream\n\n' + content

signing_block = """    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

"""
content = content.replace('android {', 'android {\n' + signing_block)

content = content.replace(
    'getByName("release") {',
    'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")'
)

splits_block = """    splits {
        abi {
            isUniversalApk = false
            reset()
            include("arm64-v8a", "armeabi-v7a")
        }
    }

    defaultConfig {"""
content = content.replace('defaultConfig {', splits_block)

with open(build_file, 'w') as f:
    f.write(content)

print('=== Patched build.gradle.kts ===')
print(content)
