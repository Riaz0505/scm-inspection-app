# Camera Scanner Not Opening - Fix Guide

## Problem
You see "Opening camera..." message and "Retry Camera" button, but the native camera scanner does not open on your Android phone/tablet.

## Why This Happens
The camera plugin might not be:
1. **Synced to native Android code** (missing: `npx cap sync`)
2. **Rebuilt in Android Studio** (plugin changes not compiled)
3. **Deployed to your device** (old APK still running)

## Solution Steps

### Step 1: Sync Plugin to Native Code
Run this command from your project folder:
```bash
npm run cap:sync
```
This will:
- Rebuild the web app
- Copy the Capacitor barcode scanner plugin to Android native code

**Wait for completion** - you should see output like:
```
> npm run cap:sync
✔ copy web assets
✔ sync
```

### Step 2: Open Android Project in Android Studio
```bash
npx cap open android
```

### Step 3: Clean and Rebuild
In Android Studio:
1. **Menu** → **Build** → **Clean Project** (wait for completion)
2. **Menu** → **Build** → **Rebuild Project** (wait for this to finish)
3. **Menu** → **Build** → **Build & Run** (or press Shift + F10)

### Step 4: Deploy to Phone/Tablet
- Connect your Android device via USB
- Make sure USB Debugging is enabled (Settings → Developer Options → USB Debugging)
- Android Studio will deploy the APK to your device automatically

### Step 5: Test Camera
1. Open the SCM QC app on your phone
2. Click "Live Camera" tab
3. camera should now open native device camera

## Check if Plugin Loaded (Developer Console)
1. On your computer, open browser DevTools: **F12**
2. Open the app in browser for debugging: `npm run dev`
3. Click the camera button and watch the console
4. You should see logs like:
   ```
   📱 Starting native scanner...
   ✅ BarcodeScanner plugin loaded
   📷 Requesting camera permissions...
   📋 Permission status: {camera: "granted"}
   ✅ Permission granted
   ```

## If Still Not Working

### Android Permission Issue
Check if camera permission is granted on your phone:
1. **Settings** → **Apps** → **SCM Garments QC**
2. **Permissions** → **Camera** → enable it

### Plugin Not Registered
Verify plugin is in native Android:
- File: `android/capacitor.settings.gradle`
  - Should have: `include ':capacitor-mlkit-barcode-scanning'`

- File: `android/app/capacitor.build.gradle`
  - Should have: `implementation project(':capacitor-mlkit-barcode-scanning')`

- File: `android/app/src/main/assets/capacitor.plugins.json`
  - Should have:
    ```json
    {
      "pkg": "@capacitor-mlkit/barcode-scanning",
      "classpath": "io.capawesome.capacitorjs.plugins.mlkit.barcodescanning.BarcodeScannerPlugin"
    }
    ```

### Fallback: Use Image Upload
If camera still doesn't open, use the "Upload Image" tab to scan QR codes from pictures instead.

## Troubleshooting Checklist
- [ ] Ran `npm run cap:sync`
- [ ] Rebuilt project in Android Studio
- [ ] Camera permission enabled in phone settings
- [ ] Running native APK, not web browser
- [ ] Connected to phone via USB/emulator
- [ ] Restarted the app after rebuilding
- [ ] Check browser F12 console for error messages

## Still Need Help?
Check the error message displayed in the app when you click "Retry Camera" - it will tell you exactly what's wrong.
