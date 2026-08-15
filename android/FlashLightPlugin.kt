package dev.wefter.bridge

import android.content.Context
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import org.json.JSONObject

class FlashLightPlugin(context: Context, dispatcher: BridgeDispatcher) :
        WefterPlugin(context, dispatcher) {

    private val cameraManager: CameraManager
        get() = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

    private val mainHandler = Handler(Looper.getMainLooper())

    private val flashCameraId: String? by lazy {
        try {
            cameraManager.cameraIdList.firstOrNull { id ->
                cameraManager
                        .getCameraCharacteristics(id)
                        .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        } catch (e: CameraAccessException) {
            null
        }
    }

    private val maxStrengthLevel: Int by lazy {
        val id = flashCameraId ?: return@lazy 1
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return@lazy 1
        try {
            cameraManager
                    .getCameraCharacteristics(id)
                    .get(CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL)
                    ?.coerceAtLeast(1)
                    ?: 1
        } catch (e: CameraAccessException) {
            1
        }
    }

    @Volatile private var isOn = false
    @Volatile private var currentLevel = 0f

    init {
        cameraManager.registerTorchCallback(
                object : CameraManager.TorchCallback() {
                    override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
                        if (cameraId != flashCameraId || enabled == isOn) return
                        isOn = enabled
                        currentLevel = if (enabled) currentLevel.takeIf { it > 0f } ?: 1f else 0f
                        emit("flash-light:changed", stateJson().put("reason", "external"))
                    }

                    override fun onTorchModeUnavailable(cameraId: String) {
                        if (cameraId != flashCameraId || !isOn) return
                        isOn = false
                        currentLevel = 0f
                        emit("flash-light:changed", stateJson().put("reason", "unavailable"))
                    }
                },
                mainHandler
        )
    }

    @WefterMethod
    fun isAvailable(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        val available = flashCameraId != null
        val variableSupported = available && maxStrengthLevel > 1
        val result =
                JSONObject()
                        .put("available", available)
                        .put("variableStrengthSupported", variableSupported)
        if (variableSupported) result.put("maxLevel", maxStrengthLevel)
        resolve(callback, result)
    }

    @WefterMethod
    fun on(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        applyLevel(payload.optDouble("level", 1.0).toFloat(), callback)
    }

    @WefterMethod
    fun off(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        applyLevel(0f, callback)
    }

    @WefterMethod
    fun toggle(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        if (isOn) {
            applyLevel(0f, callback)
        } else {
            applyLevel(payload.optDouble("level", 1.0).toFloat(), callback)
        }
    }

    @WefterMethod
    fun getState(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        resolve(callback, stateJson())
    }

    private fun applyLevel(rawLevel: Float, callback: (Result<Any>) -> Unit) {
        val id = flashCameraId
        if (id == null) {
            reject(callback, "NOT_AVAILABLE", "No camera with a flash unit on this device")
            return
        }

        if (rawLevel.isNaN() || rawLevel < 0f || rawLevel > 1f) {
            reject(callback, "INVALID_LEVEL", "level must be between 0.0 and 1.0")
            return
        }

        try {
            when {
                rawLevel <= 0f -> {
                    cameraManager.setTorchMode(id, false)
                    isOn = false
                    currentLevel = 0f
                }
                else -> {
                    cameraManager.setTorchMode(id, true)
                    isOn = true
                    currentLevel = rawLevel.coerceAtLeast(1f)
                }
            }
            resolve(callback, stateJson())
        } catch (e: CameraAccessException) {
            reject(
                    callback,
                    "TORCH_UNAVAILABLE",
                    e.message
                            ?: "The flash is currently unavailable (in use elsewhere, or overheated)."
            )
        } catch (e: IllegalArgumentException) {
            reject(callback, "INVALID_LEVEL", e.message ?: "Unsupported brightness level")
        }
    }

    private fun stateJson(): JSONObject =
            JSONObject().put("on", isOn).put("level", currentLevel.toDouble())
}
