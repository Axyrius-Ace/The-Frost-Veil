# Frost Veil V2

## Android hotfix

- Removed the camera-sized RenderTexture lighting pass on touch/coarse-pointer devices. It was producing the broken black rectangle and hard seams visible after Android viewport compositing.
- Kept flashlight aiming, occlusion checks, hidden-clue detection, and a lightweight flashlight cone on Android.
- Capped Phaser renderer resolution at 1x and enabled rounded resize handling to avoid high-DPI framebuffer seams and reduce GPU memory use.

## Build

```bash
npm run build:apk
```

The generated Android project is updated by Capacitor sync. The final signed APK still needs to be assembled in Android Studio or with the local Gradle/Android SDK environment.
