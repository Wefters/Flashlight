import AVFoundation
import Foundation

final class FlashLightPlugin: WefterPlugin {

    private lazy var device: AVCaptureDevice? = AVCaptureDevice.default(for: .video)

    // @WefterMethod
    func isAvailable(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let available = device?.hasTorch ?? false
        resolve(callback, data: [
            "available": available,
            "variableStrengthSupported": available,
        ])
    }

    // @WefterMethod
    func on(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let level = (payload["level"] as? NSNumber)?.floatValue ?? 1.0
        applyLevel(level, callback: callback)
    }

    // @WefterMethod
    func off(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        applyLevel(0, callback: callback)
    }

    // @WefterMethod
    func toggle(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        if device?.isTorchActive == true {
            applyLevel(0, callback: callback)
        } else {
            let level = (payload["level"] as? NSNumber)?.floatValue ?? 1.0
            applyLevel(level, callback: callback)
        }
    }

    // @WefterMethod
    func getState(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        resolve(callback, data: stateData())
    }

    private func applyLevel(_ rawLevel: Float, callback: @escaping (Result<Any, Error>) -> Void) {
        guard let device = device, device.hasTorch else {
            reject(callback, code: "NOT_AVAILABLE", message: "No torch available on this device")
            return
        }

        guard rawLevel.isFinite, rawLevel >= 0, rawLevel <= 1 else {
            reject(callback, code: "INVALID_LEVEL", message: "level must be between 0.0 and 1.0")
            return
        }

        // Dispatch hardware I/O to a background queue so the bridge thread stays responsive.
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try device.lockForConfiguration()
            } catch {
                self.reject(callback, code: "TORCH_UNAVAILABLE", message: "Could not access the flash: \(error.localizedDescription)")
                return
            }
            defer { device.unlockForConfiguration() }

            do {
                if rawLevel <= 0 {
                    device.torchMode = .off
                } else {
                    try device.setTorchModeOn(level: rawLevel)
                }
                self.resolve(callback, data: self.stateData())
            } catch {
                self.reject(callback, code: "TORCH_UNAVAILABLE", message: "Could not set the flash level: \(error.localizedDescription)")
            }
        }
    }

    private func stateData() -> [String: Any] {
        ["on": device?.isTorchActive ?? false, "level": device?.torchLevel ?? 0]
    }
}
