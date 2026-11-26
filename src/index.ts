/** Controls the camera flash as a torch, including brightness where the device supports it. */

import { definePlugin, registerHook } from "@wefterjs/core";

/** Whether the device has a torch and whether its brightness can be set. */
export interface FlashlightAvailability {
  available: boolean;
  variableStrengthSupported: boolean;
  maxLevel?: number;
}

/** Whether the torch is on and its brightness from 0 to 1. */
export interface FlashlightState {
  on: boolean;
  level: number;
}

/** Brightness from 0 to 1 (default 1). Ignored when the device cannot vary it. */
export interface OnOptions {
  level?: number;
}

/** The torch changed without this plugin: another app or the system used it, or it became unavailable. */
export interface FlashlightChangedEvent extends FlashlightState {
  reason: "external" | "unavailable";
}

/** Native methods of the plugin. */
const NativeFlashLight = definePlugin<{
  /** Whether the device has a torch. */
  isAvailable: () => Promise<FlashlightAvailability>;
  /** Turns the torch on. */
  on: (options?: OnOptions) => Promise<FlashlightState>;
  /** Turns the torch off. */
  off: () => Promise<FlashlightState>;
  /** Turns the torch on if it is off, and off if it is on. */
  toggle: (options?: OnOptions) => Promise<FlashlightState>;
  /** The torch's current state. */
  getState: () => Promise<FlashlightState>;
}>("flash-light", {
  isAvailable: true,
  on: true,
  off: true,
  toggle: true,
  getState: true,
});

/** The FlashLight plugin. */
export const FlashLight = {
  ...NativeFlashLight,
  /**
   * Calls `callback` when the torch changes outside the app.
   *
   * @returns A handle whose `remove()` stops listening.
   */
  onChanged(callback: (data: FlashlightChangedEvent) => void): {
    remove(): void;
  } {
    return registerHook("flash-light:changed", callback as (data: unknown) => void);
  },
};
