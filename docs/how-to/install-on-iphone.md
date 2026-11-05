# How to install a development build on your iPhone

Apple Health needs native code, so Composite can't run in Expo Go. Use a development build.

**Prerequisites:** an active Apple Developer Program membership, an Expo account, and `.env` filled in.

1. Build:
   ```bash
   npx eas-cli@latest build --profile development --platform ios
   ```
   On the first build, let EAS log in to Apple, create the bundle ID `com.katyauchter.composite`, and register your device.
2. Install: open the build link on your iPhone (or scan the QR code) and install it.
3. Run the JavaScript server:
   ```bash
   npx expo start --dev-client
   ```
4. Open Composite on the phone.

**When to rebuild:** only after adding a package with native code or changing `app.json` plugins or permissions. JavaScript changes reload instantly without a rebuild.

**Adding another tester's phone:** `npx eas-cli@latest device:create`, then rebuild.
