# Google Survey Setup (Copy/Paste)

## 1) Apps Script code

Copy all code below into `Code.gs`:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  const data = JSON.parse(e.postData.contents || "{}");

  sheet.appendRow([
    new Date(),
    data.q1_age || "",
    data.q2_freq || "",
    data.q3_focus || "",
    data.q4_try || "",
    data.q5_texture || "",
    data.q6_taste || "",
    data.q7_sweetness || "",
    data.q8_favorite || "",
    data.q9_packaging || "",
    data.q10_buy || "",
    data.source || "",
    data.submittedAt || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 2) Deploy Web App

1. In Google Sheet: `Extensions -> Apps Script`
2. Save project
3. `Deploy -> New deployment -> Web app`
4. Execute as: `Me`
5. Who has access: `Anyone`
6. Copy Web App URL

## 3) Paste URL into project

Open `script.js`, replace:

```js
const GOOGLE_SCRIPT_WEB_APP_URL = "";
```

with:

```js
const GOOGLE_SCRIPT_WEB_APP_URL = "YOUR_GOOGLE_WEB_APP_URL";
```

