# AI Emergency Health Passport - Mobile App (Local Backend)

This app is configured to use your laptop-hosted FastAPI backend over LAN.

## 1) API base URL (no Railway)

`ApiService` reads API base URL from `API_BASE_URL` with this default:

`http://192.168.x.x:8000`

Code in `lib/services/api_service.dart`:

```dart
const String baseUrl = String.fromEnvironment(
	'API_BASE_URL',
	defaultValue: 'http://192.168.x.x:8000',
);
```

Use your actual PC LAN IP (for example, `192.168.1.10`) when running or building.

## 2) Run backend locally

From `backend/`:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 3) Network requirements

- Phone and laptop must be connected to the same Wi-Fi.
- Windows Firewall must allow inbound TCP on port `8000`.
- Do not use `localhost` or `127.0.0.1` for physical Android device testing.

## 4) Run Flutter app

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:8000
```

## 5) Build debug APK

```bash
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.x.x:8000
```

## 6) Verify flows

- Login works
- Register works
- Medical profile works
- Doctor dashboard works

## 7) Important note

The app works only while your laptop backend is running and reachable on the same network.
If the laptop is OFF or disconnected, the mobile app API calls will fail.
