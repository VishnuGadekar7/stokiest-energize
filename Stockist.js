const mongoose = require("mongoose");

const StockistSchema = new mongoose.Schema({
  // Meta
  hq: { type: String },
  date: { type: String },
  stockistCode: { type: String },

  // Basic Info
  nameAndAddress: { type: String },
  telephoneNo: { type: String },
  faxNo: { type: String },
  mobileNo: { type: String },

  // Proprietors
  proprietors: [
    {
      name: { type: String },
      residentialAddress: { type: String },
    },
  ],
  dateOfIncorporation: { type: String },

  // Business
  businessType: {
    wholesale: { type: Boolean, default: false },
    retail: { type: Boolean, default: false },
    both: { type: Boolean, default: false },
  },
  godownArea: { type: String },
  distanceFromNearest: { type: String },

  // Sister Companies
  sisterCompanies: [
    {
      name: { type: String },
      address: { type: String },
      turnover: { type: String },
    },
  ],

  // Licenses
  salesTaxNo: { type: String },
  drugLicenceNo: { type: String },

  // Banking
  bankersNameAddress: { type: String },
  creditFacility: {
    cashCredit: { type: String },
    other: { type: String },
    total: { type: String },
    givenToDays: { type: String },
    doctors: { type: Boolean, default: false },
    chemists: { type: Boolean, default: false },
  },

  // Financials
  financials: {
    annualTurnover: { type: String },
    capitalEmployed: { type: String },
    fixedAssets: { type: String },
    netWorth: { type: String },
  },

  // Distributorship
  distributorships: [
    {
      companyName: { type: String },
      noOfYrs: { type: String },
      annualTurnover: { type: String },
      avgStockHolding: { type: String },
      avgStockMaintained: { type: String },
      paymentDirect: { type: String },
      paymentBank: { type: String },
      noOfDays: { type: String },
      avgPurchasesPerMonth: { type: String },
      statementDate: { type: String },
    },
  ],

  // Logistics
  transporters: [{ type: String }],
  noOfSalesman: { type: String },
  deliveryVehicles: { type: String },
  discontinuedDetails: { type: String },

  // System
  status: {
    type: String,
    default: "New",
    enum: ["New", "Under Review", "Approved", "Rejected"],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Stockist", StockistSchema);
