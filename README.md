# lputility-webview

LPUtility — Network Diagnostics, Infrastructure Intelligence & Utilities.

## Overview
LPUtility is a high-performance web and Android WebView application combining active multi-region network probes with authoritative BGP Autonomous System routing intelligence.

## Features
- **Network Diagnostics:** Dual-API integration using **Globalping API** (multi-continent ping, DNS, HTTP, and traceroute probes) and **RIPE Stat API** (BGP prefix, ASN, and organization holder).
- **Tools & Utilities Catalog:** 8 interactive capabilities for live network testing and offline calculations.
- **IPv4 Subnet Studio:** Bitwise network boundaries, wildcard masks, and VLSM subnet partitioning.
- **IPv6 128-Bit Calculator:** Full 128-bit hexadecimal expansion, RFC 5952 canonical compression, and /64 subnet counts using native BigInt math.
- **Password & Secret Generator:** Cryptographically secure token generator with Shannon entropy calculation (NIST SP 800-63B).
- **Responsive Layout:** Tested across viewports from 320px (iPhone SE) to 1920px (Desktop FHD).
- **Native Android WebView:** Kotlin Android Studio project (`responsive webview/`) with back-navigation, swipe-to-refresh, progress tracking, and offline asset fallback.

## Quick Start
```bash
# Install dependencies
npm install

# Run automated tests (Vitest)
npm test

# Start development server
npm run dev

# Build production bundle
npm run build
```

## Android Studio Build
The native Android project is located in `responsive webview/`:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\cc\AppData\Local\Android\Sdk"
cd "responsive webview"
.\gradlew assembleDebug
```
Output APK: `responsive webview/app/build/outputs/apk/debug/app-debug.apk`

## GitHub Actions Deployment
Automated production deployment to GitHub Pages is configured in `.github/workflows/deploy.yml`.
Website URL: `https://ruru-o.github.io/lputility-webview/`
