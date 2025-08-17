const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();
const PORT = 3000;

let companies = [];

// Function to load CSV data
function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => {
          cleanRow[k.trim()] = row[k] ? row[k].trim() : row[k];
        });

        // Extract month from CompanyRegistrationdate_date (format: dd-mm-yyyy or yyyy-mm-dd)
        if (cleanRow.CompanyRegistrationdate_date) {
          const parts = cleanRow.CompanyRegistrationdate_date.split("-");
          if (parts.length === 3) {
            let monthNum;
            if (parts[0].length === 4) {
              // yyyy-mm-dd
              monthNum = parts[1];
            } else {
              // dd-mm-yyyy
              monthNum = parts[1];
            }

            const monthMap = {
              "01": "January", "02": "February", "03": "March",
              "04": "April", "05": "May", "06": "June",
              "07": "July", "08": "August", "09": "September",
              "10": "October", "11": "November", "12": "December"
            };
            cleanRow.Month = monthMap[monthNum] || "Unknown";
          }
        }

        companies.push(cleanRow);
      })
      .on("end", () => {
        console.log(`${filePath} loaded — total rows so far: ${companies.length}`);
        resolve();
      })
      .on("error", err => reject(err));
  });
}

// Load all CSVs before starting the server
async function loadData() {
  await loadCSV("data/telangana_june_to_aug.csv");
  await loadCSV("data/tamilnadu_june_to_aug.csv");
  await loadCSV("data/karnataka_june_to_aug.csv");
}

// API endpoint to search companies
app.get("/search", (req, res) => {
  let results = companies;
  const { state, month, name } = req.query;

  if (state) {
    results = results.filter(c =>
      c.CompanyStateCode?.toLowerCase() === state.toLowerCase()
    );
  }

  if (month) {
    const monthMap = {
      "06": "June", "6": "June", "june": "June",
      "07": "July", "7": "July", "july": "July",
      "08": "August", "8": "August", "august": "August"
    };

    const normalizedMonth = monthMap[month.toLowerCase()] || null;

    if (normalizedMonth) {
      results = results.filter(c =>
        c.Month?.toLowerCase() === normalizedMonth.toLowerCase()
      );
    } else {
      results = []; // invalid month filter
    }

    console.log("Results after month filter:", results.length);
  }

  if (name) {
    results = results.filter(c =>
      c.CompanyName?.toLowerCase().includes(name.toLowerCase())
    );
  }

  res.json(results);
});

loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
