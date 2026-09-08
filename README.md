# @wefterjs/flash-light

Official Wefter plugin for controlling the hardware camera LED flashlight or torch on Android and iOS.

## Features

- Check hardware availability and variable intensity torch support.
- Turn the flashlight on with optional brightness levels.
- Turn off or toggle the flashlight state.
- Query current on or off state and brightness levels.
- Subscribe to hardware state changes triggered externally by the operating system.

## Installation and setup

Install the plugin package in your Wefter application:

```bash
wefter add @wefterjs/flash-light
wefter sync
```

## JavaScript API reference

Import `FlashLight` from `@wefterjs/flash-light`:

```ts
import { FlashLight } from "@wefterjs/flash-light";
```

### Check hardware availability

```ts
const status = await FlashLight.isAvailable();

console.log("Torch available:", status.available);
console.log("Variable brightness supported:", status.variableStrengthSupported);
if (status.maxLevel !== undefined) {
  console.log("Maximum brightness level:", status.maxLevel);
}
```

### Turn flashlight on

Turn the torch on with default maximum brightness, or provide a specific level:

```ts
// Turn on at full brightness
await FlashLight.on();

// Or specify a brightness level (between 1 and maxLevel, or normalized)
await FlashLight.on({ level: 5 });
```

Resolves with `{ on: true, level: number }`.

### Turn flashlight off

```ts
const state = await FlashLight.off();
console.log("Torch state:", state.on); // false
```

Resolves with `{ on: false, level: 0 }`.

### Toggle flashlight

Switches between on and off based on current state:

```ts
const state = await FlashLight.toggle();
console.log("Torch is now:", state.on ? "on" : "off");
```

### Inspect current state

```ts
const state = await FlashLight.getState();
console.log("Is on:", state.on);
console.log("Current level:", state.level);
```

### Hardware state change events

Subscribe to torch state changes caused by camera operations or operating system controls:

```ts
const sub = FlashLight.onChanged((event) => {
  console.log("Flashlight changed:", event.on, event.level);
  console.log("Change reason:", event.reason); // "external" or "unavailable"
});

// Remove listener when no longer needed
sub.remove();
```

## Platform implementation notes

### Android

- Uses `android.hardware.camera2.CameraManager`.
- On Android 13 (API 33) and later, uses `turnOnTorchWithStrengthLevel` for variable brightness control if supported by the camera device.
- Registers a `CameraManager.TorchCallback` to listen to external torch state changes.

### iOS

- Uses `AVCaptureDevice` corresponding to the default back-facing video camera.
- Acquires configuration lock via `lockForConfiguration()`.
- Sets torch mode using `setTorchModeOn(level:)` and monitors torch active status.

## License

[MIT](LICENSE) © 2026 Sandip Ghimire
