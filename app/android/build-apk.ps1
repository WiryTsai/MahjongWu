$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ProjectRoot
$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$PlatformRoot = Join-Path $SdkRoot "platforms\android-36.1"
$BuildToolsRoot = Join-Path $SdkRoot "build-tools\36.1.0"
$BuildRoot = Join-Path $ProjectRoot "build\manual"
$GenRoot = Join-Path $BuildRoot "gen"
$ClassRoot = Join-Path $BuildRoot "classes"
$DexRoot = Join-Path $BuildRoot "dex"
$AssetRoot = Join-Path $BuildRoot "assets"
$FlatResources = Join-Path $BuildRoot "resources.zip"
$UnsignedApk = Join-Path $BuildRoot "mahjong-waits-unsigned.apk"
$DexedApk = Join-Path $BuildRoot "mahjong-waits-dexed.apk"
$AlignedApk = Join-Path $BuildRoot "mahjong-waits-aligned.apk"
$SignedApk = Join-Path $BuildRoot "mahjong-waits-debug.apk"
$Keystore = Join-Path $BuildRoot "debug.keystore"

$Aapt2 = Join-Path $BuildToolsRoot "aapt2.exe"
$D8 = Join-Path $BuildToolsRoot "d8.bat"
$Zipalign = Join-Path $BuildToolsRoot "zipalign.exe"
$Apksigner = Join-Path $BuildToolsRoot "apksigner.bat"
$AndroidJar = Join-Path $PlatformRoot "android.jar"
$Manifest = Join-Path $ProjectRoot "app\src\main\AndroidManifest.xml"
$Resources = Join-Path $ProjectRoot "app\src\main\res"
$JavaSource = Join-Path $ProjectRoot "app\src\main\java\com\codex\mahjongwaits\MainActivity.java"

# Native Android SDK commands do not automatically throw PowerShell errors.
function Invoke-Checked {
    param([scriptblock]$Command)
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

Remove-Item $BuildRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $BuildRoot, $GenRoot, $ClassRoot, $DexRoot, $AssetRoot | Out-Null

# Copy the web app into APK assets so WebView can load android_asset/index.html.
Copy-Item (Join-Path $RepoRoot "index.html") $AssetRoot
Copy-Item (Join-Path $RepoRoot "styles.css") $AssetRoot
Copy-Item (Join-Path $RepoRoot "app.js") $AssetRoot

Invoke-Checked { & $Aapt2 compile --dir $Resources -o $FlatResources }
Invoke-Checked { & $Aapt2 link `
    -o $UnsignedApk `
    -I $AndroidJar `
    --manifest $Manifest `
    --java $GenRoot `
    --min-sdk-version 23 `
    --target-sdk-version 36 `
    -A $AssetRoot `
    $FlatResources }

$JavaFiles = @($JavaSource) + @(Get-ChildItem $GenRoot -Recurse -Filter "*.java" | ForEach-Object { $_.FullName })
Invoke-Checked { & javac -encoding UTF-8 -source 8 -target 8 -bootclasspath $AndroidJar -d $ClassRoot $JavaFiles }
$ClassFiles = @(Get-ChildItem $ClassRoot -Recurse -Filter "*.class" | ForEach-Object { $_.FullName })
Invoke-Checked { & $D8 --min-api 23 --lib $AndroidJar --output $DexRoot $ClassFiles }

# aapt2 creates the resource APK first, then classes.dex is added to it.
Copy-Item $UnsignedApk $DexedApk
Push-Location $DexRoot
Invoke-Checked { & jar uf $DexedApk "classes.dex" }
Pop-Location

Invoke-Checked { & $Zipalign -f 4 $DexedApk $AlignedApk }

if (!(Test-Path $Keystore)) {
    # This debug keystore is for local testing only.
    Invoke-Checked { & keytool -genkeypair `
        -keystore $Keystore `
        -storepass android `
        -keypass android `
        -alias androiddebugkey `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -dname "CN=Android Debug,O=Android,C=US" }
}

Invoke-Checked { & $Apksigner sign `
    --ks $Keystore `
    --ks-pass pass:android `
    --key-pass pass:android `
    --out $SignedApk `
    $AlignedApk }

Invoke-Checked { & $Apksigner verify $SignedApk }
Write-Host "Built APK: $SignedApk"
