# Contributing to @wefterjs/flash-light

Thank you for your interest in contributing to `@wefterjs/flash-light`, the official Wefter plugin for hardware camera LED flashlight and torch controls with variable intensity support.

## Code of conduct

By contributing to this repository, you agree to abide by our [code of conduct](https://github.com/Wefters/.github/blob/main/CODE_OF_CONDUCT.md).

## Repository layout

This repository is structured as an official Wefter plugin:

- `plugin.json`: Manifest defining the plugin name (`flash-light`), methods, hooks, Android permissions, and iOS Info.plist entries.
- `src/index.ts`: TypeScript entry point exporting the typed `FlashLight` wrapper.
- `android/`: Native Kotlin implementation extending `WefterPlugin`.
- `ios/`: Native Swift implementation conforming to `WefterPlugin`.
- `test/`: Vitest test suites executing against mocked bridge environments.
- `README.md`: Public documentation detailing installation, methods, types, and platform notes.

## Development workflow

### Prerequisites

- Node.js 18 or later
- pnpm 9 or later
- JDK 17 (for Android native code)
- Xcode 16 or later on macOS (for iOS native code)

### Installing dependencies and building

```bash
pnpm install
pnpm build
pnpm test
```

### Testing in Demo-App

To test your plugin changes inside a live application:

1. Navigate to the `Demo-App` directory in the Wefters workspace.
2. Verify that `package.json` references this local plugin directory via a workspace or file link.
3. Run the development server with `pnpm dev` or launch on a device with `npx wefter run android --watch`.

## Native implementation notes

Android uses CameraManager.TorchCallback. iOS uses AVCaptureDevice torch modes.

When modifying native code:
- Ensure asynchronous operations do not block the main UI thread.
- Catch native exceptions and return descriptive bridge errors using the standardized error codes.
- Do not add unnecessary third-party dependencies unless strictly required.

## Submitting pull requests

1. Fork this repository and create a feature branch:
   ```bash
   git checkout -b fix/issue-description
   ```
2. Implement your changes, keeping TypeScript and native code in sync.
3. Update `README.md` if adding or changing method parameters.
4. Run `pnpm test` to confirm unit test coverage.
5. Open a pull request against the `main` or `master` branch.

## License

By contributing to `@wefterjs/flash-light`, you agree that your contributions will be licensed under the [MIT License](LICENSE).
