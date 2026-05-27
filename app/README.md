# 麻將聽牌助手

麻將聽牌助手是一個可輸入手牌並即時計算聽牌結果的小工具。使用者透過點選牌張建立手牌，系統會判斷目前是否聽牌，並列出所有可胡的進張。

> 備註：本專案使用 OpenAI Codex 協助完成需求拆解、介面設計、JavaScript 聽牌演算法、Android WebView 封裝與 APK 建置流程。

## 功能特色

- 支援點選式輸入手牌，避免手動輸入造成格式錯誤
- 自動統計目前手牌張數
- 限制同一張牌最多 4 張，符合實際麻將牌組
- 支援 13 張聽 14 張
- 支援 16 張聽 17 張
- 13 張模式支援一般胡牌、七對子、國士無雙
- 16 張模式支援 5 面子 1 雀頭
- 可封裝成 Android APK，在手機或模擬器上執行

## 使用技術

- HTML
- CSS
- JavaScript
- Android WebView
- Java
- Android SDK
- OpenAI Codex

## 專案結構

```text
.
├── index.html              # 網頁主畫面
├── styles.css              # 介面樣式
├── app.js                  # 選牌互動與聽牌判斷邏輯
└── android                 # Android App 封裝專案
    ├── app
    │   └── src/main
    │       ├── AndroidManifest.xml
    │       ├── java/.../MainActivity.java
    │       └── res
    ├── build-apk.ps1       # 直接建置 debug APK 的腳本
    └── README.md
```

## 網頁版測試

直接用瀏覽器開啟：

```text
index.html
```

或啟動本機靜態伺服器：

```powershell
python -m http.server 5173
```

然後開啟：

```text
http://127.0.0.1:5173/index.html
```

## Android APK 建置

進入 `android` 目錄後執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

建置完成後會產生：

```text
android\build\manual\mahjong-waits-debug.apk
```

這是 debug 簽章 APK，可拖曳到 Android 模擬器，或透過 `adb install` 安裝到手機。

## 測試牌型

13 張測試：

```text
123萬 123筒 123索 78索 東東
預期結果：聽 6索 / 9索
```

16 張測試：

```text
123萬 123筒 123索 789索 46筒 東東
預期結果：聽 5筒
```

## 履歷描述參考

使用 OpenAI Codex 協助開發一款麻將聽牌計算 Android App。專案以前端網頁技術實作互動式選牌介面與聽牌判斷演算法，支援 13 張與 16 張牌型，並透過 Android WebView 封裝成可安裝 APK。

專案備註：此作品由本人規劃需求與測試方向，並使用 OpenAI Codex 協助完成程式開發、註解整理與 Android APK 打包。
