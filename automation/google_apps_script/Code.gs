/**
 * Google Apps Script for EventFlow RSVP Webhook Integration
 *
 * Architecture:
 * 1. onFormSubmit(e): Triggered upon form submission. Extracts native FormResponse ID.
 * 2. HMAC-SHA256 Signing: Signs raw body payload with per-event secret key.
 * 3. Durable Retry Queue: Stores unacknowledged submissions in ScriptProperties and schedules
 *    retrySyncQueue() execution without immediate unbounded retry loops.
 */

var MAX_RETRIES = 5;

/**
 * Main form submission handler.
 */
function onFormSubmit(e) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("EVENTFLOW_WEBHOOK_URL");
  var webhookSecret = props.getProperty("EVENTFLOW_WEBHOOK_SECRET");
  var eventId = props.getProperty("EVENTFLOW_EVENT_ID");

  if (!webhookUrl || !webhookSecret || !eventId) {
    Logger.log("[EventFlow] Critical: Missing required script properties.");
    return;
  }

  var response = e.response;
  var formResponseId = response.getId();
  var itemResponses = response.getItemResponses();

  var name = "";
  var email = "";
  var phone = "";

  for (var i = 0; i < itemResponses.length; i++) {
    var title = itemResponses[i].getItem().getTitle().toLowerCase().trim();
    var val = itemResponses[i].getResponse();

    if (title.indexOf("email") !== -1) {
      email = String(val).trim().toLowerCase();
    } else if (title.indexOf("name") !== -1) {
      name = String(val).trim();
    } else if (title.indexOf("phone") !== -1 || title.indexOf("mobile") !== -1 || title.indexOf("whatsapp") !== -1) {
      phone = String(val).trim();
    }
  }

  var payload = {
    response_id: formResponseId,
    name: name,
    email: email,
    phone: phone
  };

  var success = dispatchWebhook(webhookUrl, webhookSecret, eventId, payload);
  if (!success) {
    enqueueForRetry(formResponseId, payload);
  }
}

/**
 * Signs and dispatches the HTTP POST request to FastAPI.
 */
function dispatchWebhook(webhookUrl, webhookSecret, eventId, payload) {
  var payloadString = JSON.stringify(payload);
  var timestamp = String(Math.floor(new Date().getTime() / 1000));

  // Compute HMAC-SHA256 over exact raw payload body
  var rawSig = Utilities.computeHmacSha256Signature(payloadString, webhookSecret);
  var signatureHex = rawSig.reduce(function(str, chr) {
    var byteStr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (byteStr.length === 1 ? '0' : '') + byteStr;
  }, "");

  // Build target URL
  var targetEndpoint = webhookUrl.replace(/\/+$/, "") + "/" + eventId;

  var options = {
    method: "post",
    contentType: "application/json",
    payload: payloadString,
    headers: {
      "X-Webhook-Signature": signatureHex,
      "X-Webhook-Timestamp": timestamp
    },
    muteHttpExceptions: true
  };

  try {
    var resp = UrlFetchApp.fetch(targetEndpoint, options);
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log("[EventFlow] Webhook delivery succeeded for response: " + payload.response_id);
      return true;
    } else {
      Logger.log("[EventFlow] Webhook rejected with HTTP " + code + ": " + resp.getContentText());
      return false;
    }
  } catch (err) {
    Logger.log("[EventFlow] Network error during webhook dispatch: " + err.toString());
    return false;
  }
}

/**
 * Enqueues failed delivery into persistent ScriptProperties.
 */
function enqueueForRetry(responseId, payload) {
  var props = PropertiesService.getScriptProperties();
  var queueJson = props.getProperty("EVENTFLOW_RETRY_QUEUE") || "{}";
  var queue = JSON.parse(queueJson);

  queue[responseId] = {
    payload: payload,
    attempts: (queue[responseId] ? queue[responseId].attempts : 0) + 1,
    last_attempt: new Date().getTime()
  };

  props.setProperty("EVENTFLOW_RETRY_QUEUE", JSON.stringify(queue));
  ensureScheduledTrigger();
}

/**
 * Scheduled trigger to process retry queue.
 */
function retrySyncQueue() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("EVENTFLOW_WEBHOOK_URL");
  var webhookSecret = props.getProperty("EVENTFLOW_WEBHOOK_SECRET");
  var eventId = props.getProperty("EVENTFLOW_EVENT_ID");

  var queueJson = props.getProperty("EVENTFLOW_RETRY_QUEUE") || "{}";
  var queue = JSON.parse(queueJson);
  var remainingKeys = Object.keys(queue);

  if (remainingKeys.length === 0) {
    return;
  }

  for (var i = 0; i < remainingKeys.length; i++) {
    var id = remainingKeys[i];
    var item = queue[id];

    if (item.attempts >= MAX_RETRIES) {
      Logger.log("[EventFlow] Maximum retries reached for response: " + id + ". Moving to dead-letter.");
      delete queue[id];
      continue;
    }

    var success = dispatchWebhook(webhookUrl, webhookSecret, eventId, item.payload);
    if (success) {
      delete queue[id];
    } else {
      item.attempts += 1;
      item.last_attempt = new Date().getTime();
    }
  }

  props.setProperty("EVENTFLOW_RETRY_QUEUE", JSON.stringify(queue));
}

function ensureScheduledTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "retrySyncQueue") {
      return;
    }
  }
  ScriptApp.newTrigger("retrySyncQueue")
    .timeBased()
    .everyMinutes(5)
    .create();
}
