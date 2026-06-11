# FloatingBubbleService Android integration

This folder contains the Kotlin foreground-service implementation for the LingoLens Android overlay bubble. The current repository is a React/Vite web app, so copy `FloatingBubbleService.kt` into the Android module when wiring the native app.

## Required Android pieces

Add these permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Register the service:

```xml
<service
    android:name=".overlay.FloatingBubbleService"
    android:exported="false"
    android:foregroundServiceType="mediaProjection|microphone" />
```

Add dependencies:

```gradle
implementation "com.google.mlkit:text-recognition:16.0.1"
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1"
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1"
implementation "androidx.core:core-ktx:1.13.1"
```

## Control actions

Send these service intents from your settings screen:

- `ACTION_SET_SCREEN_TRANSLATION_ENABLED` with `EXTRA_ENABLED` to enable/disable long/double-tap OCR screen translation.
- `ACTION_SET_AUDIO_TRANSLATION_ENABLED` with `EXTRA_ENABLED` to enable/disable single-tap audio translation.
- `ACTION_SET_TRANSLATION_ENDPOINT` with `EXTRA_TRANSLATION_ENDPOINT` to point the service at your deployed `/api/translate` endpoint.
- `ACTION_SET_MEDIA_PROJECTION` with the MediaProjection permission result data after `MediaProjectionManager.createScreenCaptureIntent()` succeeds.

Single tap emits the package-local broadcast `ACTION_AUDIO_TRANSLATION_REQUESTED` with `EXTRA_AUDIO_CAPTURE_MS = 5000`; connect your existing 5-second audio capture pipeline to that broadcast.
## Web/PWA settings bridge

The React setting now also emits a browser/native bridge payload whenever the user toggles screen overlay translation:

- `window.LingoLensAndroid.configureScreenTranslator(payloadJson)`
- `window.LingoLensAndroid.setScreenOverlayTranslationEnabled(enabled)`
- `window.LingoLensAndroid.requestScreenCapturePermission()` when enabling
- `window.ReactNativeWebView.postMessage(payloadJson)` for React Native/WebView shells

`payloadJson` contains:

```json
{
  "type": "LINGOLENS_SCREEN_OVERLAY",
  "enabled": true,
  "endpoint": "https://your-domain.com/api/translate",
  "authToken": "optional"
}
```

The Android host should translate that bridge message into:

1. `ACTION_SET_TRANSLATION_ENDPOINT` with `EXTRA_TRANSLATION_ENDPOINT` and optional `EXTRA_TRANSLATION_AUTH_TOKEN`.
2. `ACTION_SET_SCREEN_TRANSLATION_ENABLED` with `EXTRA_ENABLED`.
3. `MediaProjectionManager.createScreenCaptureIntent()` and then `ACTION_SET_MEDIA_PROJECTION` after permission succeeds.


## Make the bubble icon visible above every app

A web/PWA install can update itself from the web, but Android does not allow a normal web page to draw over other apps. To keep the LingoLens icon visible on top of WhatsApp, Chrome, YouTube, maps, or any other app, ship the native Android wrapper and enable the foreground overlay service.

Recommended activation flow in the Android host:

1. When the user turns on screen translation from the web UI bridge, open Android settings with `Settings.ACTION_MANAGE_OVERLAY_PERMISSION` if `Settings.canDrawOverlays(context)` is false.
2. After the user grants “Display over other apps”, start `FloatingBubbleService` as a foreground service.
3. Request screen capture with `MediaProjectionManager.createScreenCaptureIntent()` and pass the result back to the service with `ACTION_SET_MEDIA_PROJECTION`.
4. Send `ACTION_SET_TRANSLATION_ENDPOINT` using the deployed web URL, then send `ACTION_SET_SCREEN_TRANSLATION_ENABLED` with `EXTRA_ENABLED = true`.
5. Keep the service notification visible. Android requires this notification for long-running overlay and screen-capture work.

User-facing steps:

1. Install/open the Android app.
2. Open Settings > Screen translation bubble.
3. Tap enable.
4. Allow “Display over other apps”.
5. Allow “Start recording/casting” for screen OCR.
6. The floating “ترجم” bubble stays visible above other apps. Single tap can trigger audio translation; double tap or long press reads the current screen text.

If the bubble disappears, check battery optimization settings and set the app to “Unrestricted” so Android does not kill the foreground service.
