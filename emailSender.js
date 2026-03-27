const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (pdfBuffer, formData) => {
  try {
    const submissionDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const businessType = formData.businessType
      ? [
          formData.businessType.wholesale ? "Wholesale" : null,
          formData.businessType.retail ? "Retail" : null,
          formData.businessType.both ? "Both" : null,
        ]
          .filter(Boolean)
          .join(", ") || "Not specified"
      : "Not specified";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Stockist Application</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f0f4f0; }
    .wrapper { max-width: 640px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #1a6b4a 0%, #0d4a32 100%); padding: 36px 40px 28px; text-align: center; }
    .header img { width: 64px; margin-bottom: 12px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #a8d5c2; margin: 6px 0 0; font-size: 13px; }
    .badge { display: inline-block; background: #f0fdf4; color: #1a6b4a; border: 1.5px solid #1a6b4a; border-radius: 20px; padding: 4px 18px; font-size: 13px; font-weight: 600; margin-top: 14px; }
    .body { padding: 36px 40px; }
    .alert-box { background: #f0fdf4; border-left: 4px solid #1a6b4a; border-radius: 6px; padding: 14px 18px; margin-bottom: 28px; }
    .alert-box p { margin: 0; color: #374151; font-size: 14px; line-height: 1.6; }
    .section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 12px; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .info-item { background: #f9fafb; border-radius: 8px; padding: 12px 16px; border: 1px solid #e5e7eb; }
    .info-item .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px; }
    .info-item .value { font-size: 14px; color: #111827; font-weight: 600; word-break: break-word; }
    .info-item.full { grid-column: 1 / -1; }
    .attachment-box { background: #1a6b4a; color: white; border-radius: 10px; padding: 18px 24px; display: flex; align-items: center; gap: 14px; margin-top: 10px; margin-bottom: 28px; }
    .attachment-box .icon { font-size: 32px; }
    .attachment-box .text .title { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
    .attachment-box .text .sub { font-size: 12px; color: #a8d5c2; margin: 0; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 22px 40px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.7; }
    .footer a { color: #1a6b4a; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>⚡ ENERGIZE PHARMACEUTICALS (P) LIMITED</h1>
    <p>SBU of DAKSON GROUP — Stockist Appointment Division</p>
    <span class="badge">🆕 New Stockist Application Received</span>
  </div>

  <div class="body">
    <div class="alert-box">
      <p>A new stockist application has been submitted through the online portal. Please review the details below and refer to the attached PDF for the complete application.</p>
    </div>

    <p class="section-title">Applicant Information</p>
    <div class="info-grid">
      <div class="info-item full">
        <div class="label">Name &amp; Address</div>
        <div class="value">${formData.nameAndAddress || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">Mobile No.</div>
        <div class="value">${formData.mobileNo || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">Telephone No.</div>
        <div class="value">${formData.telephoneNo || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">HQ</div>
        <div class="value">${formData.hq || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">Date of Application</div>
        <div class="value">${formData.date || submissionDate}</div>
      </div>
    </div>

    <p class="section-title">Business Details</p>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Type of Business</div>
        <div class="value">${businessType}</div>
      </div>
      <div class="info-item">
        <div class="label">Drug Licence No.</div>
        <div class="value">${formData.drugLicenceNo || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">Sales Tax No.</div>
        <div class="value">${formData.salesTaxNo || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Annual Turnover</div>
        <div class="value">Rs. ${formData.financials ? formData.financials.annualTurnover || "—" : "—"} Lacs</div>
      </div>
    </div>

    <p class="section-title">Attached Document</p>
    <div class="attachment-box">
      <div class="icon">📄</div>
      <div class="text">
        <p class="title">Complete Stockist Application Form (PDF)</p>
        <p class="sub">Submitted on ${submissionDate} — Contains Page 1 (filled) &amp; Page 2 (Office Use)</p>
      </div>
    </div>

    <p style="font-size:13px;color:#6b7280;margin:0;">
      This email was automatically generated by the Energize Pharmaceuticals Stockist Portal.
      Please do not reply to this email directly.
    </p>
  </div>

  <div class="footer">
    <p>
      <strong>ENERGIZE PHARMACEUTICALS (P) LIMITED</strong><br/>
      24, 2nd Floor, B-Building, City Vista Downtown, EON IT Park Road, Kharadi, PUNE-411014 (MH) INDIA<br/>
      <a href="mailto:sales@energizepharma.com">sales@energizepharma.com</a> &nbsp;|&nbsp;
      <a href="http://www.energizepharma.com">www.energizepharma.com</a><br/>
      Tel: +020-65-414-555 / 080-87-514-555
    </p>
  </div>
</div>
</body>
</html>
    `;

    const applicantName = (formData.nameAndAddress || "Applicant")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 40);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Stockist_${applicantName}_${dateStr}.pdf`;

    // Strip newlines from textarea fields before using in subject
    const subjectName = (formData.nameAndAddress || "Unknown")
      .replace(/[\r\n]+/g, " ")
      .trim();
    const subjectHQ = (formData.hq || "N/A").replace(/[\r\n]+/g, " ").trim();

    const { data, error } = await resend.emails.send({
      from: "Energize Pharma <onboarding@resend.dev>",
      to: process.env.HR_EMAIL,
      subject: `New Stockist Application — ${subjectName} | HQ: ${subjectHQ}`,
      html: htmlBody,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    if (error) throw new Error(error.message);
    console.log(`[Email] Sent successfully — Message ID: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`[Email] Failed to send: ${err.message}`);
    throw err;
  }
};

module.exports = { sendEmail };
