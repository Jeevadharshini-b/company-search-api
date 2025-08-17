const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Load CSV files
let companies = [];
const files = [
  "data/tamilnadu_june_to_aug.csv",
  "data/karnataka_june_to_aug.csv",
  "data/telengana_june_to_aug.csv"
];

files.forEach(file => {
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", row => companies.push(row))
    .on("end", () => console.log(`${file} loaded`));
});

// Search API
app.get("/search", (req, res) => {
  const { name, state, month } = req.query;

  let filtered = companies;

  if (name) {
    filtered = filtered.filter(c =>
      c["CompanyName"]?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (state) {
    filtered = filtered.filter(c =>
      c["CompanyStateCode"]?.toLowerCase() === state.toLowerCase()
    );
  }

  if (month) {
    filtered = filtered.filter(c => {
      const dateStr = c["CompanyRegistrationdate_date"];
      if (!dateStr) return false;

      const parts = dateStr.split("-");
      const monthStr = parts[1]; // Assuming DD-MM-YYYY
      return monthStr?.toLowerCase() === month.toLowerCase();
    });
  }

  res.json(filtered);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));