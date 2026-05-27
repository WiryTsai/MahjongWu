# 麻將聽牌助手 Android 版

> 備註：本 Android App 使用 OpenAI Codex 協助完成 WebView 封裝、APK 建置腳本與測試流程整理。

這個 Android 版本用原生 `WebView` 包裝根目錄的網頁檔：

- `../index.html`
- `../styles.css`
- `../app.js`

## 直接建置 APK

在 `android` 目錄執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

輸出檔案：

```text
android\build\manual\mahjong-waits-debug.apk
```

這是 debug 簽章 APK，可安裝到 Android 手機測試。

## 測試方式

### 模擬器

1. 開啟 Android Studio。
2. 從 Device Manager 啟動一台模擬器。
3. 將 `android\build\manual\mahjong-waits-debug.apk` 拖曳到模擬器視窗。
4. 安裝完成後，開啟「麻將聽牌助手」。

### 實體手機

手機開啟 USB 偵錯並連接電腦後，可執行：

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r ".\build\manual\mahjong-waits-debug.apk"
```

## Android Studio

可用 Android Studio 開啟 `android` 資料夾。若 Studio 提示缺少 `android-36` SDK，照提示安裝即可使用 Gradle build。
