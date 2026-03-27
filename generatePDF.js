require("dotenv").config();
const fs = require("fs");
const path = require("path");

const CHROME_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu",
];

// Async — must be awaited
const getLaunchOptions = async () => {
  // 1. Explicit path override (highest priority)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log("[PDF] Using explicit PUPPETEER_EXECUTABLE_PATH:", process.env.PUPPETEER_EXECUTABLE_PATH);
    return {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: CHROME_ARGS,
      headless: true,
    };
  }

  // 2. Linux (Render.com) — use @sparticuz/chromium which self-contains Chromium
  if (process.platform === "linux") {
    try {
      const chromium = require("@sparticuz/chromium");
      chromium.setHeadlessMode = true;
      const execPath = await chromium.executablePath();
      console.log("[PDF] Using @sparticuz/chromium:", execPath);
      return {
        executablePath: execPath,
        args: [...CHROME_ARGS, ...chromium.args],
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      };
    } catch (err) {
      console.error("[PDF] @sparticuz/chromium failed:", err.message);
    }

    // Linux fallback — system Chrome paths
    const linuxPaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) {
        console.log("[PDF] Using Linux system Chrome:", p);
        return { executablePath: p, args: CHROME_ARGS, headless: true };
      }
    }

    throw new Error("No Chrome found on Linux. Check @sparticuz/chromium install.");
  }

  // 3. Windows — auto-detect system Chrome
  const windowsPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    (process.env.LOCALAPPDATA || "") + "\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const p of windowsPaths) {
    if (fs.existsSync(p)) {
      console.log("[PDF] Using Windows system Chrome:", p);
      return { executablePath: p, args: CHROME_ARGS, headless: true };
    }
  }

  // 4. macOS fallback
  const macPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(macPath)) {
    console.log("[PDF] Using macOS Chrome");
    return { executablePath: macPath, args: CHROME_ARGS, headless: true };
  }

  throw new Error(
    "No Chrome found. Set PUPPETEER_EXECUTABLE_PATH in your environment."
  );
};

// Always use puppeteer-core — Chrome binary is supplied above
const puppeteer = require("puppeteer-core");


const tick = (checked) => (checked ? "✔" : "");
const val = (v) => (v !== undefined && v !== null && v !== "" ? v : "");
const row3 = (arr, field1, field2, field3) => {
  const r = (i) => arr && arr[i] ? arr[i] : {};
  return [r(0), r(1), r(2)].map((item) => ({
    f1: val(item[field1]),
    f2: val(item[field2]),
    f3: val(item[field3]),
  }));
};

const generatePDF = async (data) => {
  const browser = await puppeteer.launch(await getLaunchOptions());

  try {
    const page = await browser.newPage();

    const proprietors = (data.proprietors || []).concat(
      [{ name: "", residentialAddress: "" }, { name: "", residentialAddress: "" }, { name: "", residentialAddress: "" }]
    ).slice(0, 3);

    const sisterRows = row3(data.sisterCompanies || [], "name", "address", "turnover");
    const distRows = (data.distributorships || []).concat(
      Array(5).fill({})
    ).slice(0, 5);
    const transporters = (data.transporters || []).concat(["", "", ""]).slice(0, 3);

    const businessType = data.businessType || {};
    const creditFacility = data.creditFacility || {};
    const financials = data.financials || {};

    const HEADER_HTML = `
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #1a6b4a;margin-bottom:6px;">
  <tr>
    <td style="vertical-align:top;padding:6px 0;">
      <div style="font-size:18px;font-weight:900;color:#1a3c2a;letter-spacing:1px;font-family:Helvetica,Arial,sans-serif;">ENERGIZE PHARMACEUTICALS (P) LIMITED</div>
      <div style="font-size:10px;color:#555;font-weight:600;margin-top:1px;">SBU of DAKSON GROUP</div>
      <div style="font-size:8.5px;color:#333;margin-top:4px;line-height:1.5;">
        <b>Reg. Office:</b> 24, 2nd Floor, B-Building, City Vista Downtown, EON IT Park Road, Kharadi, PUNE-411014(MH) INDIA<br/>
        <b>Email:</b> sales@energizepharma.com &nbsp;|&nbsp; <b>Tel:</b> +020-65-414-555 / 080-87-514-555 &nbsp;|&nbsp; <b>Web:</b> www.energizepharma.com
      </div>
      <div style="font-size:8px;color:#555;margin-top:3px;line-height:1.5;">
        <b>Billing and Dispatch:</b> DAKSON PHARMA (CFA for Energize Pharmaceuticals (P) Limited), G.NO: 1338, M.M NO: 1/0359,
        First Floor, Jadhav Warehouse, Wagholi, Tal-Haveli, Pune-412207 (MH) INDIA
      </div>
    </td>
    <td style="width:100px;text-align:right;vertical-align:middle;padding:6px 0 6px 10px;">
      <div style="background:linear-gradient(135deg,#1a6b4a,#0d4a32);color:#fff;font-size:13px;font-weight:900;padding:12px 10px;border-radius:6px;text-align:center;letter-spacing:2px;line-height:1.3;">
        ⚡<br/>ENERGIZE
      </div>
    </td>
  </tr>
</table>
`;

    const PAGE1_HTML = `
<div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;padding:14px 18px;width:100%;box-sizing:border-box;">
  ${HEADER_HTML}

  <!-- Title Row -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td style="background:#e8f5ef;font-weight:700;font-size:8.5px;padding:4px 6px;border:1px solid #333;">
        (TO BE FILLED IN BY THE APPLICANT ONLY)
      </td>
      <td style="border:1px solid #333;padding:3px 6px;width:22%;">
        <b>HQ:</b> ${val(data.hq)}
      </td>
      <td style="border:1px solid #333;padding:3px 6px;width:22%;">
        <b>DATE:</b> ${val(data.date)}
      </td>
      <td style="border:1px solid #333;padding:3px 6px;width:22%;">
        <b>STOCKIST CODE:</b>
      </td>
    </tr>
  </table>

  <!-- Basic Info -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        BASIC INFORMATION
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:26%;">Name &amp; Address:</td>
      <td colspan="3" style="border:1px solid #ccc;padding:3px 6px;">${val(data.nameAndAddress)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">Telephone No:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:22%;">${val(data.telephoneNo)}</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:24%;">Fax No:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:22%;">${val(data.faxNo)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">Mobile No:</td>
      <td colspan="3" style="border:1px solid #ccc;padding:3px 6px;">${val(data.mobileNo)}</td>
    </tr>
  </table>

  <!-- Proprietors -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        PROPRIETOR / PARTNERS / DIRECTORS DETAILS
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:6%;">#</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:40%;">Name</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">Residential Address</td>
    </tr>
    ${proprietors.map((p, i) => `
    <tr>
      <td style="border:1px solid #ccc;padding:2px 6px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${val(p.name)}</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${val(p.residentialAddress)}</td>
    </tr>`).join("")}
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;" colspan="2">Date Of Incorporation:</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${val(data.dateOfIncorporation)}</td>
    </tr>
  </table>

  <!-- Business Type -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="6" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        BUSINESS TYPE &amp; INFRASTRUCTURE
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:22%;">Type Of Business:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:18%;">
        Wholesale: <span style="font-size:11px;">${tick(businessType.wholesale)}</span> ${businessType.wholesale ? "✔" : "☐"}
      </td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:18%;">
        Retail: ${businessType.retail ? "✔" : "☐"}
      </td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:14%;">
        Both: ${businessType.both ? "✔" : "☐"}
      </td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:14%;">Godown (Sq.Ft):</td>
      <td style="border:1px solid #ccc;padding:3px 6px;">${val(data.godownArea)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">Dist. from Nearest Stockist:</td>
      <td colspan="5" style="border:1px solid #ccc;padding:2px 6px;">${val(data.distanceFromNearest)} Kms</td>
    </tr>
  </table>

  <!-- Sister Companies -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        SISTER COMPANIES / ASSOCIATE CONCERNS
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:6%;">Sr.</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:34%;">Name</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:40%;">Address</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">Turnover (In Lac)</td>
    </tr>
    ${sisterRows.map((s, i) => `
    <tr>
      <td style="border:1px solid #ccc;padding:2px 6px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${s.f1}</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${s.f2}</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${s.f3}</td>
    </tr>`).join("")}
  </table>

  <!-- Licenses -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        LICENCES &amp; TAX REGISTRATION
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:36%;">Central &amp; State Sales Tax No:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:30%;">${val(data.salesTaxNo)}</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:18%;">Drug Licence No:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;">${val(data.drugLicenceNo)}</td>
    </tr>
  </table>

  <!-- Banking -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="6" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        BANKING &amp; CREDIT DETAILS
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:26%;">Bankers Name &amp; Address:</td>
      <td colspan="5" style="border:1px solid #ccc;padding:3px 6px;">${val(data.bankersNameAddress)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;" rowspan="4">Credit Facility<br/>(Rs. In Lacs):</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:22%;">1) Cash Credit:</td>
      <td style="border:1px solid #ccc;padding:2px 6px;width:16%;">${val(creditFacility.cashCredit)}</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;width:16%;">Given To:</td>
      <td colspan="2" style="border:1px solid #ccc;padding:2px 6px;">
        Doctors: ${creditFacility.doctors ? "✔" : "☐"} &nbsp;&nbsp; Chemists: ${creditFacility.chemists ? "✔" : "☐"}
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">2) Other:</td>
      <td style="border:1px solid #ccc;padding:2px 6px;">${val(creditFacility.other)}</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">No. Of Days:</td>
      <td colspan="2" style="border:1px solid #ccc;padding:2px 6px;">${val(creditFacility.givenToDays)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:2px 6px;">Total:</td>
      <td colspan="4" style="border:1px solid #ccc;padding:2px 6px;">${val(creditFacility.total)}</td>
    </tr>
  </table>

  <!-- Financial Summary -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        FINANCIAL SUMMARY (Rs. In Lacs)
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:25%;">Total Annual Turnover:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:25%;">Rs. ${val(financials.annualTurnover)} Lacs</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:25%;">Capital Employed:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:25%;">Rs. ${val(financials.capitalEmployed)} Lacs</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">Fixed Assets:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;">Rs. ${val(financials.fixedAssets)} Lacs</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">Net Worth:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;">Rs. ${val(financials.netWorth)} Lacs</td>
    </tr>
  </table>

  <!-- Distributorship -->
  <table width="100%" cellpadding="2" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;font-size:7.5px;">
    <tr>
      <td colspan="10" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        DISTRIBUTORSHIP DETAILS
      </td>
    </tr>
    <tr style="background:#f5f5f5;font-weight:700;text-align:center;">
      <td style="border:1px solid #ccc;padding:2px 4px;">Name of Company</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">No. of Yrs</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Annual T/O (Lacs)</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Avg Stock Holding (Lacs)</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Avg Stock (Days)</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Payment Direct</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Payment Bank</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">No. of Days</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Avg Purchases/Month</td>
      <td style="border:1px solid #ccc;padding:2px 4px;">Statement Date</td>
    </tr>
    ${distRows.map((d) => `
    <tr>
      <td style="border:1px solid #ccc;padding:2px 4px;">${val(d.companyName)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.noOfYrs)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.annualTurnover)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.avgStockHolding)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.avgStockMaintained)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.paymentDirect)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.paymentBank)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.noOfDays)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.avgPurchasesPerMonth)}</td>
      <td style="border:1px solid #ccc;padding:2px 4px;text-align:center;">${val(d.statementDate)}</td>
    </tr>`).join("")}
  </table>

  <!-- Logistics -->
  <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
    <tr>
      <td colspan="4" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
        LOGISTICS &amp; OPERATIONS
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:36%;">Preferred Approved Transporters (Select Any Two):</td>
      <td colspan="3" style="border:1px solid #ccc;padding:3px 6px;">
        1) ${val(transporters[0])} &nbsp;&nbsp;&nbsp; 2) ${val(transporters[1])} &nbsp;&nbsp;&nbsp; 3) ${val(transporters[2])}
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">No. Of Salesman:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;width:14%;">${val(data.noOfSalesman)}</td>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:24%;">Details Of Delivery Vehicles:</td>
      <td style="border:1px solid #ccc;padding:3px 6px;">${val(data.deliveryVehicles)}</td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;">Stockistship Discontinued Details:</td>
      <td colspan="3" style="border:1px solid #ccc;padding:3px 6px;">${val(data.discontinuedDetails)}</td>
    </tr>
  </table>

  <!-- Applicant Declaration -->
  <table width="100%" cellpadding="4" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-top:8px;">
    <tr>
      <td style="border:1px solid #ccc;padding:6px 8px;font-size:8px;color:#333;">
        <b>DECLARATION:</b> I/We Declare that the above is true to the best of my/our knowledge. I/We Also agree to abide by your terms and conditions.
      </td>
      <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;width:180px;font-size:8px;color:#333;">
        <div style="height:40px;border-bottom:1px dotted #555;margin-bottom:4px;"></div>
        Applicant Signature with Rubber Stamp
      </td>
    </tr>
  </table>
</div>
`;

    const PAGE2_HTML = `
<div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;padding:14px 18px;width:100%;box-sizing:border-box;position:relative;">

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72px;font-weight:900;color:rgba(0,0,0,0.055);white-space:nowrap;pointer-events:none;z-index:0;letter-spacing:4px;">
    OFFICE USE ONLY
  </div>

  <div style="position:relative;z-index:1;">
    ${HEADER_HTML}

    <!-- Page 2 Title -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:2px solid #1a6b4a;border-collapse:collapse;margin-bottom:6px;background:#f0f8f4;">
      <tr>
        <td style="text-align:center;padding:5px;font-weight:900;font-size:11px;color:#1a3c2a;letter-spacing:1px;">
          ⚡ OFFICE USE ONLY — PAGE 2
        </td>
      </tr>
    </table>

    <!-- Proposed Stockist -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:36%;">Proposed Stockist Name:</td>
        <td style="border:1px solid #ccc;padding:3px 6px;">
          <span style="border-bottom:1px dotted #555;display:inline-block;width:100%;min-height:14px;">&nbsp;</span>
        </td>
      </tr>
    </table>

    <!-- Two column layout -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:5px;">
      <tr>
        <td style="width:49%;vertical-align:top;padding-right:3px;">
          <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;height:100%;">
            <tr>
              <td style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;">
                TO BE FILLED IN BY ZSM/DSM/RSM ONLY
              </td>
            </tr>
            ${[1,2,3,4,5].map(i => `
            <tr>
              <td style="border:1px solid #ccc;padding:3px 6px;height:22px;">
                <span style="border-bottom:1px dotted #555;display:inline-block;width:100%;">&nbsp;</span>
              </td>
            </tr>`).join("")}
          </table>
        </td>
        <td style="width:2%;"></td>
        <td style="width:49%;vertical-align:top;padding-left:3px;">
          <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;height:100%;">
            <tr>
              <td style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;">
                TO BE FILLED IN BY DEPOT/C&amp;F AGENT
              </td>
            </tr>
            ${[1,2,3,4,5].map(i => `
            <tr>
              <td style="border:1px solid #ccc;padding:3px 6px;height:22px;">
                <span style="border-bottom:1px dotted #555;display:inline-block;width:100%;">&nbsp;</span>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Existing Stockist Table -->
    <table width="100%" cellpadding="2" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;font-size:7.5px;">
      <tr>
        <td colspan="9" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
          EXISTING STOCKIST INFORMATION
        </td>
      </tr>
      <tr style="background:#f5f5f5;font-weight:700;text-align:center;">
        <td style="border:1px solid #ccc;padding:2px 3px;">Sr. No</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">Name</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">Operation Since (Month/Yrs)</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">Avg O/S Last 12 Month</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">Total Sale Last 12 Month</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">No. of Month Not Purchased</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">O/S Total</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">Above Days O/S</td>
        <td style="border:1px solid #ccc;padding:2px 3px;">As On Date</td>
      </tr>
      ${[1,2,3].map(i => `
      <tr>
        <td style="border:1px solid #ccc;padding:3px;text-align:center;">${i}</td>
        ${Array(8).fill('<td style="border:1px solid #ccc;padding:3px;"><span style="border-bottom:1px dotted #aaa;display:inline-block;width:100%;min-height:12px;">&nbsp;</span></td>').join("")}
      </tr>`).join("")}
    </table>

    <!-- Any Other Information -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:26%;">Any Other Information:</td>
        <td style="border:1px solid #ccc;padding:3px 6px;height:36px;">
          <span style="border-bottom:1px dotted #555;display:inline-block;width:100%;">&nbsp;</span>
        </td>
      </tr>
    </table>

    <!-- Depot Manager Signature -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td style="background:#f5f5f5;font-weight:700;border:1px solid #ccc;padding:3px 6px;width:50%;">Signature of Depot Manager / C&amp;F Agent:</td>
        <td style="border:1px solid #ccc;padding:3px 6px;width:24%;font-weight:700;background:#f5f5f5;">Date:</td>
        <td style="border:1px solid #ccc;padding:3px 6px;"></td>
      </tr>
    </table>

    <!-- Questions 1-7 -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td colspan="2" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
          FIELD MANAGER EVALUATION (ZSM/DSM/RSM)
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;width:4%;font-weight:700;">1)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">Reason For new stockist: <span style="border-bottom:1px dotted #555;display:inline-block;width:200px;">&nbsp;Additional / Replacement</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">2)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">If Replacement, against whom (Stockist Name): <span style="border-bottom:1px dotted #555;display:inline-block;width:160px;">&nbsp;</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">3)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">Benefit you shall derive out of this appointment: <span style="border-bottom:1px dotted #555;display:inline-block;width:140px;">&nbsp;</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">4)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">Expected average monthly sales from new stockist in next 6 months: <span style="border-bottom:1px dotted #555;display:inline-block;width:80px;">&nbsp;</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">5)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">If Additional appointment the nearest stockist — Name: <span style="border-bottom:1px dotted #555;display:inline-block;width:80px;">&nbsp;</span> &nbsp; Place: <span style="border-bottom:1px dotted #555;display:inline-block;width:70px;">&nbsp;</span> &nbsp; Distance in Km: <span style="border-bottom:1px dotted #555;display:inline-block;width:50px;">&nbsp;</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">6)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">Proposed initial O/S limit: Rs. <span style="border-bottom:1px dotted #555;display:inline-block;width:120px;">&nbsp;</span></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:2px 6px;vertical-align:top;font-weight:700;">7)</td>
        <td style="border:1px solid #ccc;padding:2px 6px;">Comments on financial stability: <span style="border-bottom:1px dotted #555;display:inline-block;width:160px;">&nbsp;</span></td>
      </tr>
    </table>

    <!-- Market Coverage -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td colspan="2" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
          MARKET COVERAGE
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:3px 6px;vertical-align:top;width:50%;">
          <b>Name Of Districts Covered:</b><br/>
          1. <span style="border-bottom:1px dotted #555;display:inline-block;width:160px;">&nbsp;</span><br/>
          2. <span style="border-bottom:1px dotted #555;display:inline-block;width:160px;">&nbsp;</span><br/>
          3. <span style="border-bottom:1px dotted #555;display:inline-block;width:160px;">&nbsp;</span>
        </td>
        <td style="border:1px solid #ccc;padding:3px 6px;vertical-align:top;">
          No. Of Chemists/Retailers covered: <span style="border-bottom:1px dotted #555;display:inline-block;width:60px;">&nbsp;</span><br/>
          No. Of Nursing Homes Covered: <span style="border-bottom:1px dotted #555;display:inline-block;width:60px;">&nbsp;</span><br/>
          No. Of Major Institutions Covered: <span style="border-bottom:1px dotted #555;display:inline-block;width:60px;">&nbsp;</span><br/>
          No. Of Chemists/Retailers Blacklisted: <span style="border-bottom:1px dotted #555;display:inline-block;width:60px;">&nbsp;</span><br/>
          <br/>
          Sale: a) % of sale to wholesale: <span style="border-bottom:1px dotted #555;display:inline-block;width:40px;">&nbsp;</span><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b) % of Retail Sales: <span style="border-bottom:1px dotted #555;display:inline-block;width:40px;">&nbsp;</span><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Total: <span style="border-bottom:1px dotted #555;display:inline-block;width:40px;">&nbsp;</span>
        </td>
      </tr>
    </table>

    <!-- Declaration -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:8px;color:#333;width:66%;">
          <b>DECLARATION:</b> I/We Declare that the above is true to the best of my/our knowledge. I/We Also agree to abide by your terms and conditions.
        </td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;font-size:8px;color:#333;">
          <div style="height:40px;border:1px dotted #555;margin-bottom:4px;border-radius:3px;"></div>
          Applicant Signature with Rubber Stamp
        </td>
      </tr>
    </table>

    <!-- Verification -->
    <table width="100%" cellpadding="3" cellspacing="0" style="border:1px solid #333;border-collapse:collapse;margin-bottom:5px;">
      <tr>
        <td colspan="3" style="background:#f0f8f4;font-weight:700;font-size:8.5px;border:1px solid #333;padding:3px 6px;letter-spacing:0.5px;">
          VERIFICATION
        </td>
      </tr>
      <tr>
        <td colspan="3" style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">
          I have personally visited the party and verified the information submitted in the forms. I confirm the correctness of the same.
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:3px 6px;font-size:8px;width:40%;">
          Comments: <span style="border-bottom:1px dotted #555;display:inline-block;width:120px;">&nbsp;</span>
        </td>
        <td colspan="2" style="border:1px solid #ccc;padding:3px 6px;"></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">1) From TBM</td>
        <td colspan="2" style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">
          TBM Sign: <span style="border-bottom:1px dotted #555;display:inline-block;width:120px;">&nbsp;</span>
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">2) From RBM</td>
        <td colspan="2" style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">
          RBM Sign: <span style="border-bottom:1px dotted #555;display:inline-block;width:120px;">&nbsp;</span>
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">3) From BH</td>
        <td colspan="2" style="border:1px solid #ccc;padding:3px 6px;font-size:8px;">
          BH Sign: <span style="border-bottom:1px dotted #555;display:inline-block;width:120px;">&nbsp;</span>
        </td>
      </tr>
    </table>
  </div><!-- end z-index wrapper -->
</div>
`;

    const FOOTER_HTML = `
<div style="font-family:Helvetica,Arial,sans-serif;font-size:7.5px;color:#555;text-align:center;padding:6px 18px 10px;border-top:1px solid #ddd;margin-top:8px;">
  ENERGIZE PHARMACEUTICALS (P) LIMITED — SBU of DAKSON GROUP &nbsp;|&nbsp;
  sales@energizepharma.com &nbsp;|&nbsp; www.energizepharma.com &nbsp;|&nbsp;
  Tel: +020-65-414-555 / 080-87-514-555
</div>
`;

    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background: white; }
    @page { size: A4 portrait; margin: 0; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div>
    ${PAGE1_HTML}
    ${FOOTER_HTML}
  </div>
  <div class="page-break">
    ${PAGE2_HTML}
    ${FOOTER_HTML}
  </div>
</body>
</html>
`;

    await page.setContent(fullHTML, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" },
    });

    console.log("[PDF] Generated successfully — buffer size:", pdfBuffer.length, "bytes");
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

module.exports = { generatePDF };
