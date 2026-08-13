import { definePlugin, registerHook } from "@wefterjs/core";

export interface FlashlightAvailability {
  available: boolean;
  variableStrengthSupported: boolean;
  maxLevel?: number;
}

export interface FlashlightState {
  on: boolean;
  level: number;
}

export interface OnOptions {
  level?: number;
}

export interface FlashlightChangedEvent extends FlashlightState {
  reason: "external" | "unavailable";
}

const NativeFlashLight = definePlugin<{
  isAvailable: () => Promise<FlashlightAvailability>;
  on: (options?: OnOptions) => Promise<FlashlightState>;
  off: () => Promise<FlashlightState>;
  toggle: (options?: OnOptions) => Promise<FlashlightState>;
  getState: () => Promise<FlashlightState>;
}>("flash-light", {
  isAvailable: true,
  on: true,
  off: true,
  toggle: true,
  getState: true,
});

export const FlashLight = {
  ...NativeFlashLight,
  onChanged(callback: (data: FlashlightChangedEvent) => void): {
    remove(): void;
  } {
    return registerHook(
      "flash-light:changed",
      callback as (data: unknown) => void,
    );
  },
};
