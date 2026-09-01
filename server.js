const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./db");
const Stockist = require("./Stockist");
const { generatePDF } = require("./generatePDF");
const { sendEmail } = require("./emailSender");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
connectDB();

// POST /submit — Main form submission endpoint
app.post("/submit", async (req, res) => {
  try {
    console.log("[Server] Form received");

    const formData = req.body;

    // Ensure nested arrays are proper arrays (JSON parsing safety)
    if (typeof formData.proprietors === "string") {
      formData.proprietors = JSON.parse(formData.proprietors);
    }
    if (typeof formData.sisterCompanies === "string") {
      formData.sisterCompanies = JSON.parse(formData.sisterCompanies);
    }
    if (typeof formData.distributorships === "string") {
      formData.distributorships = JSON.parse(formData.distributorships);
    }
    if (typeof formData.transporters === "string") {
      formData.transporters = JSON.parse(formData.transporters);
    }
    if (typeof formData.businessType === "string") {
      formData.businessType = JSON.parse(formData.businessType);
    }
    if (typeof formData.creditFacility === "string") {
      formData.creditFacility = JSON.parse(formData.creditFacility);
    }
    if (typeof formData.financials === "string") {
      formData.financials = JSON.parse(formData.financials);
    }

    // Save to MongoDB first — this is fast (~1s)
    const stockist = new Stockist(formData);
    await stockist.save();
    console.log("[Server] Saved to DB — ID:", stockist._id);

    // Respond immediately so the user sees success without waiting for PDF/email
    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      id: stockist._id,
    });

    // Generate PDF + send email in the background (fire and forget)
    generatePDF(formData)
      .then((pdfBuffer) => {
        console.log("[Server] PDF generated — ID:", stockist._id);
        return sendEmail(pdfBuffer, formData);
      })
      .then(() => {
        console.log("[Server] Email sent — ID:", stockist._id);
      })
      .catch((err) => {
        console.error("[Server] Background PDF/email error — ID:", stockist._id, err.message);
      });

  } catch (err) {
    console.error("[Server] Error in /submit:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`[Server] Energize Stockist Form running on http://localhost:${PORT}`);
});
