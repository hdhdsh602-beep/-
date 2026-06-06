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
