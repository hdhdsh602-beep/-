package com.lingolens.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import kotlin.coroutines.resume
import kotlin.math.abs

class FloatingBubbleService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private lateinit var windowManager: WindowManager
    private lateinit var prefs: SharedPreferences

    private var bubbleView: View? = null
    private var translationView: View? = null
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var screenJob: Job? = null
    private var singleTapJob: Job? = null

    private var lastScreenCaptureAt = 0L
    private var lastTapAt = 0L
    private var downAt = 0L
    private var downX = 0f
    private var downY = 0f
    private var movedDuringTouch = false

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        startForeground(NOTIFICATION_ID, buildNotification())
        showFloatingBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val incoming = intent ?: return START_STICKY
        when (incoming.action) {
            ACTION_STOP_SERVICE -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_SET_MEDIA_PROJECTION -> installMediaProjection(incoming)
            ACTION_SET_SCREEN_TRANSLATION_ENABLED -> {
                val enabled = incoming.getBooleanExtra(EXTRA_ENABLED, false)
                prefs.edit()
                    .putBoolean(KEY_SCREEN_TRANSLATION_ENABLED, enabled)
                    .apply()
                if (enabled) {
                    showFloatingBubble()
                    showCenterOverlay("فقاعة ترجمة الشاشة جاهزة")
                } else if (!prefs.getBoolean(KEY_AUDIO_TRANSLATION_ENABLED, true)) {
                    removeBubble()
                    dismissTranslationOverlay()
                } else {
                    showCenterOverlay("تم قفل ترجمة الشاشة")
                }
            }
            ACTION_SET_AUDIO_TRANSLATION_ENABLED -> {
                prefs.edit()
                    .putBoolean(KEY_AUDIO_TRANSLATION_ENABLED, incoming.getBooleanExtra(EXTRA_ENABLED, true))
                    .apply()
            }
            ACTION_SET_TRANSLATION_ENDPOINT -> {
                prefs.edit()
                    .putString(KEY_TRANSLATION_ENDPOINT, incoming.getStringExtra(EXTRA_TRANSLATION_ENDPOINT).orEmpty())
                    .putString(KEY_TRANSLATION_AUTH_TOKEN, incoming.getStringExtra(EXTRA_TRANSLATION_AUTH_TOKEN).orEmpty())
                    .apply()
                showFloatingBubble()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        singleTapJob?.cancel()
        screenJob?.cancel()
        removeBubble()
        dismissTranslationOverlay()
        releaseProjectionResources()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun installMediaProjection(intent: Intent) {
        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        val resultData = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_RESULT_DATA)
        }

        if (resultCode != 0 && resultData != null) {
            val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection?.stop()
            mediaProjection = manager.getMediaProjection(resultCode, resultData)
            prefs.edit().putBoolean(KEY_SCREEN_TRANSLATION_ENABLED, true).apply()
            showCenterOverlay("تم تفعيل ترجمة الشاشة")
        }
    }

    private fun showFloatingBubble() {
        if (bubbleView != null) return

        bubbleView = buildBubbleView().apply {
            setOnTouchListener(BubbleTouchListener())
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 24
            y = 240
        }

        windowManager.addView(bubbleView, params)
    }

    private fun buildBubbleView(): View {
        val bubble = TextView(this)
        bubble.text = "ترجم"
        bubble.textSize = 12f
        bubble.setTextColor(Color.WHITE)
        bubble.typeface = Typeface.DEFAULT_BOLD
        bubble.gravity = Gravity.CENTER
        bubble.setPadding(22, 16, 22, 16)
        bubble.background = roundedBackground(Color.rgb(90, 106, 59), 42f)
        return bubble
    }

    private inner class BubbleTouchListener : View.OnTouchListener {
        override fun onTouch(view: View, event: MotionEvent): Boolean {
            val params = view.layoutParams as WindowManager.LayoutParams

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downAt = SystemClock.elapsedRealtime()
                    downX = event.rawX
                    downY = event.rawY
                    movedDuringTouch = false
                    return true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    if (abs(dx) > DRAG_SLOP || abs(dy) > DRAG_SLOP) {
                        movedDuringTouch = true
                        params.x += dx.toInt()
                        params.y += dy.toInt()
                        windowManager.updateViewLayout(view, params)
                        downX = event.rawX
                        downY = event.rawY
                    }
                    return true
                }

                MotionEvent.ACTION_UP -> {
                    if (movedDuringTouch) return true

                    val now = SystemClock.elapsedRealtime()
                    val pressDuration = now - downAt
                    if (pressDuration >= LONG_PRESS_MS) {
                        singleTapJob?.cancel()
                        lastTapAt = 0L
                        triggerScreenTranslation()
                    } else if (now - lastTapAt <= DOUBLE_TAP_MS) {
                        singleTapJob?.cancel()
                        lastTapAt = 0L
                        triggerScreenTranslation()
                    } else {
                        lastTapAt = now
                        singleTapJob?.cancel()
                        singleTapJob = serviceScope.launch {
                            delay(DOUBLE_TAP_MS)
                            if (lastTapAt != 0L) {
                                lastTapAt = 0L
                                triggerAudioTranslation()
                            }
                        }
                    }
                    return true
                }
            }
            return false
        }
    }

    private fun triggerAudioTranslation() {
        if (!prefs.getBoolean(KEY_AUDIO_TRANSLATION_ENABLED, true)) {
            showCenterOverlay("الترجمة الصوتية مقفلة من الإعدادات")
            return
        }

        sendBroadcast(
            Intent(ACTION_AUDIO_TRANSLATION_REQUESTED)
                .setPackage(packageName)
                .putExtra(EXTRA_AUDIO_CAPTURE_MS, AUDIO_CAPTURE_MS)
        )
    }

    private fun triggerScreenTranslation() {
        if (!prefs.getBoolean(KEY_SCREEN_TRANSLATION_ENABLED, false)) {
            showCenterOverlay("فعّل ترجمة الشاشة من الإعدادات أولاً")
            return
        }

        if (mediaProjection == null) {
            showCenterOverlay("اسمح بالتقاط الشاشة لتفعيل OCR")
            return
        }

        val now = SystemClock.elapsedRealtime()
        if (now - lastScreenCaptureAt < SCREEN_CAPTURE_COOLDOWN_MS) return
        lastScreenCaptureAt = now

        screenJob?.cancel()
        screenJob = serviceScope.launch {
            showCenterOverlay("جاري ترجمة الشاشة...")
            val result = captureOneFrameAndTranslate()
            if (result.arabicText.isNotBlank()) {
                result.bounds?.let { showTextNearBounds(result.arabicText, it) } ?: showCenterOverlay(result.arabicText)
            }
        }
    }

    private suspend fun captureOneFrameAndTranslate(): ScreenTranslationResult = withContext(Dispatchers.Default) {
        var bitmap: Bitmap? = null
        try {
            bitmap = captureSingleScreenshot() ?: return@withContext ScreenTranslationResult("لم يتم التقاط الشاشة")
            val recognizedText = runOcr(bitmap)
            val lines = recognizedText.textBlocks
                .flatMap { block -> block.lines }
                .filter { line -> line.text.isMostlyEnglish() }

            val englishText = lines
                .joinToString(separator = "\n") { it.text.trim() }
                .take(MAX_OCR_CHARS)

            if (englishText.isBlank()) return@withContext ScreenTranslationResult("لا يوجد نص إنجليزي واضح")

            val mergedBounds = lines.mapNotNull { it.boundingBox }.mergeBounds()
            val arabicText = translateScreenText(englishText)
            ScreenTranslationResult(arabicText, mergedBounds)
        } catch (error: Throwable) {
            ScreenTranslationResult("تعذر ترجمة الشاشة الآن")
        } finally {
            bitmap?.recycle()
            releaseProjectionResources(keepProjection = true)
        }
    }

    private suspend fun captureSingleScreenshot(): Bitmap? = withContext(Dispatchers.Default) {
        val metrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        val reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        imageReader = reader
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "LingoLensSingleFrame",
            width,
            height,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader.surface,
            null,
            null
        ) ?: return@withContext null

        val image = withTimeoutOrNull(SCREENSHOT_TIMEOUT_MS) { awaitLatestImage(reader) } ?: return@withContext null
        image.use { frame -> imageToBitmap(frame, width, height) }
    }

    private suspend fun awaitLatestImage(reader: ImageReader): Image? = suspendCancellableCoroutine { continuation ->
        val handler = Handler(Looper.getMainLooper())
        reader.setOnImageAvailableListener({ source ->
            val image = source.acquireLatestImage()
            if (continuation.isActive) {
                source.setOnImageAvailableListener(null, null)
                continuation.resume(image)
            } else {
                image?.close()
            }
        }, handler)
        continuation.invokeOnCancellation { reader.setOnImageAvailableListener(null, null) }
    }

    private fun imageToBitmap(image: Image, width: Int, height: Int): Bitmap {
        val plane = image.planes[0]
        val buffer = plane.buffer
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * width
        val paddedWidth = width + rowPadding / pixelStride

        val paddedBitmap = Bitmap.createBitmap(paddedWidth, height, Bitmap.Config.ARGB_8888)
        paddedBitmap.copyPixelsFromBuffer(buffer)

        val cropped = Bitmap.createBitmap(paddedBitmap, 0, 0, width, height)
        paddedBitmap.recycle()
        return cropped
    }

    private suspend fun runOcr(bitmap: Bitmap): Text {
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        return try {
            recognizer.process(InputImage.fromBitmap(bitmap, 0)).await()
        } finally {
            recognizer.close()
        }
    }

    private suspend fun translateScreenText(text: String): String = withContext(Dispatchers.IO) {
        val endpoint = prefs.getString(KEY_TRANSLATION_ENDPOINT, DEFAULT_TRANSLATION_ENDPOINT).orEmpty()
        val prompt = "Translate this text found on the screen into clear Arabic. Do NOT transliterate. Provide the output contextually and concisely."
        val payload = JSONObject()
            .put("text", "$prompt\n\n$text")
            .put("fast", true)
            .toString()

        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = NETWORK_TIMEOUT_MS.toInt()
            readTimeout = NETWORK_TIMEOUT_MS.toInt()
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            prefs.getString(KEY_TRANSLATION_AUTH_TOKEN, "")
                ?.takeIf { it.isNotBlank() }
                ?.let { setRequestProperty("Authorization", "Bearer $it") }
        }

        try {
            connection.outputStream.use { output -> output.write(payload.toByteArray(StandardCharsets.UTF_8)) }
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            val body = stream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
            if (connection.responseCode !in 200..299) return@withContext "تعذر الاتصال بمحرك الترجمة"

            val json = JSONObject(body)
            when {
                json.optString("arabic").isNotBlank() -> json.optString("arabic")
                json.optJSONObject("result")?.optString("arabic")?.isNotBlank() == true -> json.getJSONObject("result").getString("arabic")
                json.optString("translatedText").isNotBlank() -> json.optString("translatedText")
                else -> body.take(MAX_TRANSLATION_CHARS)
            }.trim().take(MAX_TRANSLATION_CHARS)
        } finally {
            connection.disconnect()
        }
    }

    private fun showCenterOverlay(arabicText: String) {
        serviceScope.launch(Dispatchers.Main.immediate) {
            dismissTranslationOverlay()
            val view = buildTranslationOverlay(arabicText)
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                overlayWindowType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
                x = 0
                y = 0
            }

            translationView = view
            windowManager.addView(view, params)
        }
    }

    private fun showTextNearBounds(arabicText: String, bounds: Rect) {
        serviceScope.launch(Dispatchers.Main.immediate) {
            dismissTranslationOverlay()
            val view = buildTranslationOverlay(arabicText)
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                overlayWindowType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = bounds.left.coerceAtLeast(16)
                y = (bounds.bottom + 12).coerceAtLeast(16)
            }

            translationView = view
            windowManager.addView(view, params)
        }
    }

    private fun buildTranslationOverlay(arabicText: String): View {
        val container = FrameLayout(this)
        container.setPadding(24, 16, 24, 16)
        container.setOnClickListener { dismissTranslationOverlay() }

        val text = TextView(this)
        text.text = arabicText
        text.textSize = 16f
        text.setTextColor(Color.WHITE)
        text.gravity = Gravity.CENTER
        text.typeface = Typeface.DEFAULT_BOLD
        text.setLineSpacing(2f, 1.05f)
        text.setPadding(28, 22, 28, 22)
        text.background = roundedBackground(Color.argb(235, 21, 19, 15), 28f)
        container.addView(text)
        return container
    }

    private fun roundedBackground(color: Int, radius: Float): GradientDrawable = GradientDrawable().apply {
        setColor(color)
        cornerRadius = radius
    }

    private fun dismissTranslationOverlay() {
        translationView?.let { view ->
            runCatching { windowManager.removeView(view) }
        }
        translationView = null
    }

    private fun removeBubble() {
        bubbleView?.let { view ->
            runCatching { windowManager.removeView(view) }
        }
        bubbleView = null
    }

    private fun releaseProjectionResources(keepProjection: Boolean = false) {
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        if (!keepProjection) {
            mediaProjection?.stop()
            mediaProjection = null
        }
    }

    private fun overlayWindowType(): Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "LingoLens Bubble", NotificationManager.IMPORTANCE_LOW)
            )
        }

        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, FloatingBubbleService::class.java).setAction(ACTION_STOP_SERVICE),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("LingoLens Bubble")
            .setContentText("Single tap: audio. Long/double tap: screen translation.")
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)
            .build()
    }

    private fun String.isMostlyEnglish(): Boolean {
        val letters = filter(Char::isLetter)
        if (letters.isBlank()) return false
        val latinCount = letters.count { it.code in 65..90 || it.code in 97..122 }
        return latinCount >= 2 && latinCount >= letters.length * 0.55
    }

    private fun List<Rect>.mergeBounds(): Rect? {
        if (isEmpty()) return null
        val result = Rect(first())
        drop(1).forEach { result.union(it) }
        return result
    }

    private data class ScreenTranslationResult(
        val arabicText: String,
        val bounds: Rect? = null
    )

    companion object {
        const val ACTION_SET_MEDIA_PROJECTION = "com.lingolens.overlay.SET_MEDIA_PROJECTION"
        const val ACTION_SET_SCREEN_TRANSLATION_ENABLED = "com.lingolens.overlay.SET_SCREEN_TRANSLATION_ENABLED"
        const val ACTION_SET_AUDIO_TRANSLATION_ENABLED = "com.lingolens.overlay.SET_AUDIO_TRANSLATION_ENABLED"
        const val ACTION_SET_TRANSLATION_ENDPOINT = "com.lingolens.overlay.SET_TRANSLATION_ENDPOINT"
        const val ACTION_AUDIO_TRANSLATION_REQUESTED = "com.lingolens.overlay.AUDIO_TRANSLATION_REQUESTED"
        const val ACTION_STOP_SERVICE = "com.lingolens.overlay.STOP_SERVICE"

        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"
        const val EXTRA_ENABLED = "extra_enabled"
        const val EXTRA_TRANSLATION_ENDPOINT = "extra_translation_endpoint"
        const val EXTRA_TRANSLATION_AUTH_TOKEN = "extra_translation_auth_token"
        const val EXTRA_AUDIO_CAPTURE_MS = "extra_audio_capture_ms"

        const val PREFS_NAME = "lingolens_overlay_settings"
        const val KEY_AUDIO_TRANSLATION_ENABLED = "audio_translation_enabled"
        const val KEY_SCREEN_TRANSLATION_ENABLED = "screen_translation_enabled"
        const val KEY_TRANSLATION_ENDPOINT = "translation_endpoint"
        const val KEY_TRANSLATION_AUTH_TOKEN = "translation_auth_token"

        private const val DEFAULT_TRANSLATION_ENDPOINT = "https://your-api.example.com/api/translate"
        private const val CHANNEL_ID = "lingolens_floating_bubble"
        private const val NOTIFICATION_ID = 8102
        private const val LONG_PRESS_MS = 520L
        private const val DOUBLE_TAP_MS = 260L
        private const val DRAG_SLOP = 12
        private const val AUDIO_CAPTURE_MS = 5_000
        private const val SCREEN_CAPTURE_COOLDOWN_MS = 1_500L
        private const val SCREENSHOT_TIMEOUT_MS = 1_200L
        private const val NETWORK_TIMEOUT_MS = 8_000L
        private const val MAX_OCR_CHARS = 1_600
        private const val MAX_TRANSLATION_CHARS = 1_200
    }
}
