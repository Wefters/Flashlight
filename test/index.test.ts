// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { installMockBridge, uninstallMockBridge } from "@wefterjs/core/testing";
import { WefterBridgeError } from "@wefterjs/core";
import { FlashLight } from "../src/index.js";

afterEach(() => {
  uninstallMockBridge();
});

describe("FlashLight.isAvailable", () => {
  it("resolves with what the native side reports", async () => {
    installMockBridge({
      "flash-light": (method) => {
        if (method === "isAvailable") {
          return { available: true, variableStrengthSupported: true, maxLevel: 5 };
        }
        throw new Error(`unexpected method ${method}`);
      },
    });

    const result = await FlashLight.isAvailable();

    expect(result).toEqual({ available: true, variableStrengthSupported: true, maxLevel: 5 });
  });
});

describe("FlashLight.on", () => {
  it("is callable with no arguments", async () => {
    installMockBridge({
      "flash-light": (method, payload) => {
        expect(method).toBe("on");
        expect(payload).toEqual({});
        return { on: true, level: 1 };
      },
    });

    const result = await FlashLight.on();

    expect(result).toEqual({ on: true, level: 1 });
  });

  it("forwards a specific level", async () => {
    installMockBridge({
      "flash-light": (_method, payload) => {
        expect(payload).toEqual({ level: 0.3 });
        return { on: true, level: 0.3 };
      },
    });

    const result = await FlashLight.on({ level: 0.3 });

    expect(result).toEqual({ on: true, level: 0.3 });
  });
});

describe("FlashLight.off / toggle / getState", () => {
  it("off resolves with the off state", async () => {
    installMockBridge({
      "flash-light": (method) => {
        expect(method).toBe("off");
        return { on: false, level: 0 };
      },
    });

    expect(await FlashLight.off()).toEqual({ on: false, level: 0 });
  });

  it("toggle forwards an optional level", async () => {
    installMockBridge({
      "flash-light": (method, payload) => {
        expect(method).toBe("toggle");
        expect(payload).toEqual({ level: 0.5 });
        return { on: true, level: 0.5 };
      },
    });

    expect(await FlashLight.toggle({ level: 0.5 })).toEqual({ on: true, level: 0.5 });
  });

  it("getState round-trips the current state", async () => {
    installMockBridge({
      "flash-light": (method) => {
        expect(method).toBe("getState");
        return { on: true, level: 0.7 };
      },
    });

    expect(await FlashLight.getState()).toEqual({ on: true, level: 0.7 });
  });
});

describe("FlashLight.onChanged", () => {
  it("receives what the native side emits under flash-light:changed", () => {
    let received: unknown;
    const subscription = FlashLight.onChanged((data) => {
      received = data;
    });

    window.__wefterNative.emit(
      "flash-light:changed",
      JSON.stringify({ on: false, level: 0, reason: "unavailable" }),
    );

    expect(received).toEqual({ on: false, level: 0, reason: "unavailable" });
    subscription.remove();
  });

  it("stops calling a listener after remove()", () => {
    let callCount = 0;
    const subscription = FlashLight.onChanged(() => {
      callCount++;
    });
    subscription.remove();

    window.__wefterNative.emit("flash-light:changed", JSON.stringify({ on: true, level: 1, reason: "external" }));

    expect(callCount).toBe(0);
  });
});

describe("error propagation", () => {
  it("surfaces a native rejection as a WefterBridgeError", async () => {
    installMockBridge({
      "flash-light": () => {
        throw new Error("No camera with a flash unit on this device");
      },
    });

    const call = FlashLight.on();

    await expect(call).rejects.toBeInstanceOf(WefterBridgeError);
    await expect(call).rejects.toMatchObject({
      code: "MOCK_ERROR",
      message: "No camera with a flash unit on this device",
    });
  });
});
