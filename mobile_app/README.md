# AI Emergency Health Passport - Mobile App

## 1) Configure API base URL

`ApiService` reads backend URL from `API_BASE_URL` via `--dart-define`.

Examples:

- Local LAN backend: `http://192.168.x.x:8000`
- Cloud backend: `https://your-backend-url.com`

## 2) Run from USB (development)

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:8000
```

## 3) Build standalone APK (works after USB disconnect)

Debug APK:

```bash
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.x.x:8000
```

Release APK:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-backend-url.com
```

Output APK paths:

- `build/app/outputs/flutter-apk/app-debug.apk`
- `build/app/outputs/flutter-apk/app-release.apk`

Install APK on connected phone:

```bash
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

After install, disconnect USB and launch app from phone app drawer. App stays installed and opens normally.

## 4) Local backend requirements (LAN testing)

Start backend so phone can reach it:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Also ensure:

- Phone and laptop are on same Wi-Fi.
- Windows Firewall allows inbound TCP port `8000`.

## 5) Permanent usage without laptop dependency

Deploy backend to a cloud host (Render, Railway, Fly.io, etc.), then rebuild APK with cloud URL:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-backend-url.com
```
