# Meatgrade

A phone app for sorting a carcass on the floor. The camera suggests marbling from the ribeye photo. The grader confirms the degree, and the chart stamps the call.

Beef quality uses the minimum marbling in the [USDA carcass beef standard](https://www.ams.usda.gov/grades-standards/carcass-beef-grades-and-standards) for each whole maturity group. Yield grade uses the official formula and drops the fraction, so 2.75 is yield grade 2. Pork and lamb get a plant sort, not a USDA grade. A USDA grader still assigns the official grade.

The photo stays on the phone. Salesforce stores the grade and the measurements.

## Phone app

Expo, React Native, iOS and Android.

```bash
npm install
npm test
npx expo start
```

Scan the QR code with Expo Go, or press `i` or `a` for a simulator. `npx expo start --web` runs it in a browser. The camera and library picker, image resize, and `jpeg-js` decode run on the device, and the grading chart in `shared/grading.js` reads the pixels.

Build installable apps with `npx eas-cli build`. Bundle ids are set in `app.json`.

## Salesforce package

`force-app` is a second-generation package. `Grading_Session__c` holds the session. `GradingSessionTrigger` stamps the grade on every save and overwrites a grade typed in by a client. `Meat_Grader` is the permission set for the floor. The `meatGradeCapture` Lightning component carries the same chart for the Salesforce mobile app.

Deploy with the Salesforce CLI into a scratch org or sandbox, assign Meat Grader, and run the Apex tests.
