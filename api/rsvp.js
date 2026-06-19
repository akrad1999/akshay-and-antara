const RECIPIENTS = [
  "antara.rath@gmail.com",
  "akrad1999@gmail.com",
  "rajib.rath@gmail.com",
  "radhibanu@yahoo.com",
];
const MAX_LENGTHS = {
  name: 120,
  email: 254,
  guestName: 120,
  dietary: 2000,
};

function sendJson(response, status, body) {
  response.status(status).json(body);
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRsvp(body) {
  const name = cleanString(body.name, MAX_LENGTHS.name);
  const email = cleanString(body.email, MAX_LENGTHS.email).toLowerCase();
  const attendance = body.attendance === "yes" || body.attendance === "no" ? body.attendance : "";
  const partySize = Number(body.partySize);
  const dietary = cleanString(body.dietary, MAX_LENGTHS.dietary);
  const website = cleanString(body.website, 200);
  const guestNames = Array.isArray(body.guestNames)
    ? body.guestNames
        .slice(0, 3)
        .map((guest) => cleanString(guest, MAX_LENGTHS.guestName))
    : [];

  if (website) return { spam: true };
  if (!name || !isEmail(email) || !attendance || !Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
    return { error: "Please complete all required RSVP fields." };
  }

  const expectedAdditionalGuests = partySize - 1;
  if (guestNames.length !== expectedAdditionalGuests || guestNames.some((guest) => !guest)) {
    return { error: "Please provide the full name of each additional guest." };
  }

  return { name, email, attendance, partySize, guestNames, dietary };
}

function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #dfd1be;color:#8f3341;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;vertical-align:top;width:34%;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #dfd1be;color:#251d19;font-family:Arial,sans-serif;font-size:15px;line-height:1.55;vertical-align:top;">
        ${escapeHtml(value)}
      </td>
    </tr>`;
}

function buildHostEmail(rsvp) {
  const isAttending = rsvp.attendance === "yes";
  const attendanceLabel = isAttending ? "Yes, celebrating with us" : "Unable to attend";
  const allGuests = [rsvp.name, ...rsvp.guestNames];
  const guestList = allGuests.join(", ");
  const dietary = rsvp.dietary || "None shared";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#efe5d5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(rsvp.name)} submitted a wedding RSVP.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#efe5d5;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#f8f0e3;border:1px solid #d7c6ae;">
            <tr>
              <td style="padding:38px 42px 34px;background:#9d3040;text-align:center;">
                <div style="color:#e4b145;font-family:Georgia,serif;font-size:17px;letter-spacing:3px;">AR<sup style="font-size:10px;">2</sup></div>
                <div style="margin-top:20px;color:#f8f0e3;font-family:Georgia,serif;font-size:42px;line-height:1.05;">A new RSVP</div>
                <div style="margin-top:13px;color:#f2d7d1;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                  Hua Hin · March 21–24, 2027
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 42px 42px;">
                <div style="margin-bottom:8px;color:#9d3040;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">
                  ${isAttending ? "Celebrating in Thailand" : "Response received"}
                </div>
                <div style="margin-bottom:24px;color:#251d19;font-family:Georgia,serif;font-size:34px;line-height:1.2;">
                  ${escapeHtml(rsvp.name)}
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${detailRow("Attendance", attendanceLabel)}
                  ${detailRow("Email", rsvp.email)}
                  ${detailRow("Party size", `${rsvp.partySize} ${rsvp.partySize === 1 ? "guest" : "guests"}`)}
                  ${detailRow("Guest names", guestList)}
                  ${detailRow("Dietary needs / note", dietary)}
                </table>
                <div style="margin-top:30px;padding:18px 20px;background:#f1e3d0;border-left:4px solid #e4b145;color:#594a41;font-family:Arial,sans-serif;font-size:13px;line-height:1.65;">
                  Reply directly to this email to contact ${escapeHtml(rsvp.name)} at ${escapeHtml(rsvp.email)}.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 42px;background:#251d19;color:#cdbba6;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.4px;text-align:center;text-transform:uppercase;">
                The Palayana Resort · Hua Hin, Gulf of Thailand
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildHostTextEmail(rsvp) {
  const guestNames = [rsvp.name, ...rsvp.guestNames].join(", ");
  return [
    "NEW WEDDING RSVP",
    "Akshay & Antara · Hua Hin · March 21–24, 2027",
    "",
    `Full name: ${rsvp.name}`,
    `Email: ${rsvp.email}`,
    `Attendance: ${rsvp.attendance === "yes" ? "Yes" : "No"}`,
    `Party size: ${rsvp.partySize}`,
    `Guest names: ${guestNames}`,
    `Dietary needs / note: ${rsvp.dietary || "None shared"}`,
  ].join("\n");
}

function buildGuestEmail(rsvp) {
  const isAttending = rsvp.attendance === "yes";
  const firstName = rsvp.name.split(/\s+/)[0];
  const attendanceLabel = isAttending ? "Yes, attending" : "Unable to attend";
  const guestList = [rsvp.name, ...rsvp.guestNames].join(", ");
  const dietary = rsvp.dietary || "None shared";
  const heading = isAttending ? "Thailand awaits." : "Your reply is with us.";
  const message = isAttending
    ? "We are so happy you will be joining us in Hua Hin. Your RSVP has been received, and we cannot wait to celebrate together!"
    : "Thank you for letting us know. We will miss celebrating with you next year and are grateful to have your response.";

  return `<!doctype html>
<html lang="en">
  <body style="width:100% !important;margin:0;padding:0;background:#efe5d5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your RSVP for Akshay and Antara's wedding has been received.
    </div>
    <center style="width:100%;background:#efe5d5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;margin:0 auto;background:#efe5d5;">
        <tr>
          <td align="center" valign="top" style="padding:28px 12px;text-align:center;">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;max-width:640px;margin:0 auto;background:#d7a746;">
              <tr>
                <td style="padding:4px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;margin:0 auto;background:#8f3448;">
                    <tr>
                      <td style="padding:2px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;margin:0 auto;background:#f8f0e3;">
                          <tr>
                            <td align="center" style="padding:9px 16px;background:#18372e;color:#e4b145;font-family:Georgia,serif;font-size:13px;letter-spacing:8px;line-height:1;text-align:center;">
                              &#9670;&nbsp; &#10047;&nbsp; &#9670;&nbsp; &#10047;&nbsp; &#9670;
                            </td>
                          </tr>
            <tr>
              <td style="padding:0;background:#7d2736;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(145deg,#6e2230 0%,#9d3040 52%,#c66d48 100%);">
                  <tr>
                    <td style="padding:26px 28px 0;text-align:center;">
                      <div style="color:#f2cc70;font-family:Georgia,serif;font-size:18px;letter-spacing:4px;">AR<sup style="font-size:10px;">2</sup></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 18px 0;text-align:center;">
                      <div style="margin:0 auto;width:86px;height:86px;border:1px solid rgba(248,240,227,.55);border-radius:50%;background:#e4b145;box-shadow:0 0 0 12px rgba(248,240,227,.08);"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 36px 44px;text-align:center;">
                      <div style="color:#f2cc70;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;">
                        RSVP confirmation
                      </div>
                      <div style="margin-top:13px;color:#fff9ef;font-family:Georgia,serif;font-size:46px;line-height:1.05;">
                        ${heading}
                      </div>
                      <div style="margin-top:17px;color:#f6dfd4;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                        The Palayana Resort · Hua Hin
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="height:28px;background:#f8f0e3;border-radius:50% 50% 0 0 / 100% 100% 0 0;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 42px 10px;text-align:center;">
                <div style="color:#9d3040;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;">
                  March 21–24, 2027
                </div>
                <div style="margin-top:17px;color:#251d19;font-family:Georgia,serif;font-size:34px;line-height:1.2;">
                  Dear ${escapeHtml(firstName)},
                </div>
                <div style="max-width:490px;margin:17px auto 0;color:#594a41;font-family:Arial,sans-serif;font-size:15px;line-height:1.75;">
                  ${message}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:25px 42px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1e3d0;border:1px solid #dfcdb5;">
                  <tr>
                    <td style="padding:25px 26px 22px;">
                      <div style="margin-bottom:8px;color:#9d3040;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                        Your submitted response
                      </div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        ${detailRow("Attendance", attendanceLabel)}
                        ${detailRow("Party size", `${rsvp.partySize} ${rsvp.partySize === 1 ? "guest" : "guests"}`)}
                        ${detailRow("Guest names", guestList)}
                        ${detailRow("Dietary needs / note", dietary)}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 42px 38px;text-align:center;">
                <div style="color:#c28d33;font-family:Georgia,serif;font-size:26px;letter-spacing:8px;">❋ &nbsp; ❋ &nbsp; ❋</div>
                <div style="margin-top:18px;color:#594a41;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;">
                  Need to update your response? Please reply to this email and we will take care of it.
                </div>
                <div style="margin-top:24px;color:#251d19;font-family:Georgia,serif;font-size:25px;">
                  Akshay &amp; Antara
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;background:#251d19;text-align:center;">
                <div style="color:#e4b145;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                  ❋ &nbsp; ❋ &nbsp; ❋
                </div>
                <div style="margin-top:8px;color:#bda995;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;">
                </div>
              </td>
            </tr>
                          <tr>
                            <td align="center" style="padding:9px 16px;background:#18372e;color:#e4b145;font-family:Georgia,serif;font-size:13px;letter-spacing:8px;line-height:1;text-align:center;">
                              &#9670;&nbsp; &#10047;&nbsp; &#9670;&nbsp; &#10047;&nbsp; &#9670;
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;
}

function buildGuestTextEmail(rsvp) {
  const isAttending = rsvp.attendance === "yes";
  const guestNames = [rsvp.name, ...rsvp.guestNames].join(", ");
  return [
    "YOUR RSVP HAS BEEN RECEIVED",
    "Akshay & Antara · The Palayana Resort, Hua Hin",
    "March 21–24, 2027",
    "",
    isAttending
      ? "We are so happy you will be joining us in Thailand."
      : "Thank you for letting us know. We will miss celebrating with you.",
    "",
    `Attendance: ${isAttending ? "Yes" : "No"}`,
    `Party size: ${rsvp.partySize}`,
    `Guest names: ${guestNames}`,
    `Dietary needs / note: ${rsvp.dietary || "None shared"}`,
    "",
    "Need to update your response? Reply to this email.",
    "",
    "Akshay & Antara",
  ].join("\n");
}

async function sendEmail(payload, idempotencyKey) {
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  });

  const result = await resendResponse.json().catch(() => ({}));
  return { ok: resendResponse.ok, result };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RSVP_FROM_EMAIL) {
    console.error("Missing RESEND_API_KEY or RSVP_FROM_EMAIL.");
    return sendJson(response, 503, { error: "RSVP email delivery is not configured yet." });
  }

  const rsvp = normalizeRsvp(request.body || {});
  if (rsvp.spam) return sendJson(response, 200, { ok: true });
  if (rsvp.error) return sendJson(response, 400, { error: rsvp.error });

  const requestId = cleanString(request.body.requestId, 100);
  const subject = `Wedding RSVP: ${rsvp.name} — ${rsvp.attendance === "yes" ? "Yes" : "No"}, party of ${rsvp.partySize}`;
  const hostDelivery = await sendEmail(
    {
      from: process.env.RSVP_FROM_EMAIL,
      to: RECIPIENTS,
      reply_to: rsvp.email,
      subject,
      html: buildHostEmail(rsvp),
      text: buildHostTextEmail(rsvp),
      tags: [{ name: "source", value: "wedding-rsvp" }],
    },
    requestId ? `wedding-rsvp-host-${requestId}` : "",
  );

  if (!hostDelivery.ok) {
    console.error("Host RSVP delivery error:", hostDelivery.result);
    return sendJson(response, 502, { error: "We could not send your RSVP. Please try again." });
  }

  const guestDelivery = await sendEmail(
    {
      from: process.env.RSVP_FROM_EMAIL,
      to: [rsvp.email],
      reply_to: RECIPIENTS,
      subject: "Your RSVP is confirmed! — Akshay & Antara",
      html: buildGuestEmail(rsvp),
      text: buildGuestTextEmail(rsvp),
      tags: [{ name: "source", value: "wedding-rsvp-confirmation" }],
    },
    requestId ? `wedding-rsvp-guest-${requestId}` : "",
  );

  if (!guestDelivery.ok) {
    console.error("Guest RSVP confirmation delivery error:", guestDelivery.result);
    return sendJson(response, 502, {
      error: "Your RSVP was received, but we could not send the confirmation email. Please try again.",
    });
  }

  return sendJson(response, 200, {
    ok: true,
    hostEmailId: hostDelivery.result.id,
    guestEmailId: guestDelivery.result.id,
  });
};
