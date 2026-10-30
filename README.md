# Meatgrade

A phone app for the meat case. Point it at a steak and it tells you whether the steak is any good.

Meatgrade reads the white flecks inside the red (marbling) and the color of the lean, then gives a plain verdict: excellent, very good, good, lean, or very lean. It names the USDA grade the marbling most looks like (Prime, upper Choice, Choice, Select) and says how to cook it. Pick the cut and it adjusts the advice, since a lean tenderloin is normal while a lean ribeye is not. Enter the price on the tag, scan a few steaks, and Compare ranks them and picks the best value.

The estimate comes from the camera. Lighting and plastic wrap change the number. The USDA shield on the package is the official grade.

## Run it

Expo, React Native, iOS and Android.

```bash
npm install
npm test
npx expo start
```

Scan the QR code with Expo Go, or press `i` or `a` for a simulator. `npx expo start --web` runs it in a browser. The camera, library picker, image resize, and JPEG decode run on the phone; `shared/steak.js` reads the pixels and writes the verdict. Scans stay on the phone.

Build installable apps with `npx eas-cli build`. Bundle ids are in `app.json`.
