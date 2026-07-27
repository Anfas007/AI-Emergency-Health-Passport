# Mobile App

This folder contains the Flutter app used by patients.

## What The App Does

- Lets patients register and log in
- Shows patient health information
- Sends requests to the backend server
- Supports the emergency health passport workflow

## How To Run It

1. Start the backend first.
2. Install Flutter dependencies:

```bash
flutter pub get
```

3. Run the app and point it to your backend:

```bash
flutter run --dart-define=API_BASE_URL=http://<your-backend-ip>:8000
```

If you are testing on a real phone, use your computer's IP address instead of `localhost`.

## Helpful Notes

- Your phone and computer must be on the same network when testing locally.
- If the app cannot connect, check that the backend is still running.
- For more setup details, see the root `README.md`.
