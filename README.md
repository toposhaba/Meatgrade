# Meatgrade

Floor tool for sorting a carcass. The camera suggests marbling from the photo. The grader confirms the degree, and the chart stamps the call.

Beef quality uses the minimum marbling in the [USDA carcass beef standard](https://www.ams.usda.gov/grades-standards/carcass-beef-grades-and-standards) for each whole maturity group. Yield grade uses the official formula and drops the fraction, so 2.75 is yield grade 2. Pork and lamb get a plant sort, not a USDA grade. A USDA grader still assigns the official grade.

The photo stays on the device. Salesforce stores the grade and the measurements.

## Floor app

```bash
npm install
npm test
npm run dev
```

Open the local site, load the sample cut or take a ribeye photo, confirm the degree, and save. Saved grades stay in this browser.

## Salesforce package

`force-app` is a second-generation package. `Grading_Session__c` holds the session. `GradingSessionTrigger` stamps the grade on every save and overwrites a grade typed in by a client. `Meat_Grader` is the permission set for the floor. Put the Meatgrade capture component on a phone app page.

Deploy with the Salesforce CLI into a scratch org or sandbox, assign Meat Grader, and run the Apex tests.
