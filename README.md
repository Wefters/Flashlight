# @wefterjs/flashlight

Official Wefter plugin for controlling hardware camera LED flashlight/torch features on Android & iOS.

---

## Features

- 🔦 **Hardware Torch Control**: Programmatically turn the camera flash LED on, off, or toggle state.
- 💡 **Brightness Intensity**: Adjust flash brightness intensity level (0.0 to 1.0) on supported devices.
- ⚡ **State Querying & Events**: Query current torch state and subscribe to hardware state change events.

---

## Installation & Setup

1. Add the plugin to your Wefter project:

```bash
wefter add @wefterjs/flashlight
```

2. Synchronize native projects:

```bash
wefter sync
```

---

## JavaScript API Reference

Import `invokeNative` and `registerHook` from `@wefterjs/core`:

```ts
import { invokeNative, registerHook } from "@wefterjs/core";
```

### 1. `isAvailable()`

Checks if the physical device has a camera flash unit available.

```ts
interface FlashlightAvailability {
  available: boolean;
}

const res = await invokeNative<FlashlightAvailability>("flash-light", "isAvailable");
console.log("Hardware torch available:", res.available);
```

### 2. `on(options)`

Turns the camera flashlight ON.

```ts
interface FlashlightOnOptions {
  intensity?: number; // Torch level from 0.1 to 1.0 (default: 1.0)
}

await invokeNative("flash-light", "on", { intensity: 1.0 });
```

### 3. `off()`

Turns the flashlight OFF.

```ts
await invokeNative("flash-light", "off");
```

### 4. `toggle(options)`

Toggles the flashlight state (turns ON if OFF, turns OFF if ON).

```ts
interface ToggleResult {
  isOn: boolean;
}

const state = await invokeNative<ToggleResult>("flash-light", "toggle");
console.log("Torch is now:", state.isOn ? "ON" : "OFF");
```

### 5. `getState()`

Gets the current flashlight state.

```ts
interface FlashlightState {
  isOn: boolean;
  intensity: number;
}

const state = await invokeNative<FlashlightState>("flash-light", "getState");
```

---

## Event Subscriptions

Subscribe to `flash-light:changed` event stream:

```ts
import { registerHook } from "@wefterjs/core";

const sub = registerHook("flash-light:changed", (data: { isOn: boolean }) => {
  console.log("Flashlight hardware state changed:", data.isOn);
});
```

---

## Complete Usage Example

```ts
import { invokeNative } from "@wefterjs/core";

export async function toggleTorchButton() {
  const check = await invokeNative<{ available: boolean }>("flash-light", "isAvailable");

  if (!check.available) {
    alert("Camera LED torch is not available on this device.");
    return;
  }

  const result = await invokeNative<{ isOn: boolean }>("flash-light", "toggle");
  console.log(`Torch switched ${result.isOn ? "ON" : "OFF"}`);
}
```
