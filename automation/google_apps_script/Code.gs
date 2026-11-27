/**
 * Google Apps Script for EventFlow RSVP Webhook
 *
 * Trigger: Installable onFormSubmit trigger on Google Form or linked Google Sheet.
 * Security: Computes HMAC-SHA256 signature using per-event secret key.
 * Idempotency: Uses native Google Form response ID (FormResponse.getId()).
 */

function onFormSubmit(e) {
  var props = PropertiesService.getScriptProperties();
  var WEBHOOK_URL = props.getProperty("EVENTFLOW_WEBHOOK_URL");
  var WEBHOOK_SECRET = props.getProperty("EVENTFLOW_WEBHOOK_SECRET");
  var EVENT_ID = props.getProperty("EVENTFLOW_EVENT_ID");

  if (!WEBHOOK_URL || !WEBHOOK_SECRET || !EVENT_ID) {
    Logger.log("Missing EventFlow configuration properties.");
    return;
  }

  // 1. Extract native immutable Google Form response ID
  var response = e.response;
  var formResponseId = response.getId();
  var timestamp = response.getTimestamp().toISOString();
  var itemResponses = response.getItemResponses();

  var attendee = {
    name: "",
    email: "",
    phone: ""
  };
  var customFields = {};

  // 2. Map form fields based on title heuristics
  for (var i = 0; i < itemResponses.length; i++) {
    var itemTitle = itemResponses[i].getItem().getTitle().toLowerCase().trim();
    var val = itemResponses[i].getResponse();

    if (itemTitle.indexOf("email") !== -1) {
      attendee.email = String(val).trim().toLowerCase();
    } else if (itemTitle.indexOf("name") !== -1) {
      attendee.name = String(val).trim();
    } else if (itemTitle.indexOf("phone") !== -1 || itemTitle.indexOf("mobile") !== -1 || itemTitle.indexOf("whatsapp") !== -1) {
      attendee.phone = String(val).trim();
    } else {
      customFields[itemResponses[i].getItem().getTitle()] = val;
    }
  }

  var payloadObj = {
    event_id: EVENT_ID,
    form_response_id: formResponseId,
    submitted_at: timestamp,
    attendee: attendee,
    custom_fields: customFields
  };

  var payloadStr = JSON.stringify(payloadObj);
  var epochSeconds = Math.floor(new Date().getTime() / 1000);

  // 3. Compute HMAC-SHA256 Signature
  var rawSignature = Utilities.computeHmacSha256Signature(payloadStr, WEBHOOK_SECRET);
  var signatureHex = rawSignature.reduce(function(str, chr) {
    var byteStr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (byteStr.length === 1 ? '0' : '') + byteStr;
  }, "");

  // 4. Send signed HTTP POST request
  var options = {
    method: "post",
    contentType: "application/json",
    payload: payloadStr,
    headers: {
      "X-Webhook-Signature": signatureHex,
      "X-Webhook-Timestamp": String(epochSeconds)
    },
    muteHttpExceptions: true
  };

  try {
    var resp = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("EventFlow webhook response (" + resp.getResponseCode() + "): " + resp.getContentText());
  } catch (err) {
    Logger.log("Error dispatching EventFlow webhook: " + err.toString());
  }
}
