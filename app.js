const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");

const app = express();
const port = 3000;

// Maps to store browser and page instances
const browsers = new Map(); // Stores browser instances by user ID
const pages = new Map(); // Stores page instances by user ID

// Middleware
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Route to render the form
app.get("/", (req, res) => {
  res.render("index");
});

// Route to handle form submission
app.post("/submit", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const userID = Math.random(); // Assuming userID is sent from the form

  try {
    let browser;

    // Check if browser instance exists for the user, create if not
    if (!browsers.has(userID)) {
      browsers.set(userID, await puppeteer.launch({ headless: false }));
    }
    browser = browsers.get(userID);

    let page;

    // Check if page instance exists for the user, create if not
    if (!pages.has(userID)) {
      page = await browser.newPage();

      // Navigate to the website
      await page.goto("https://vieton.site/", {
        timeout: 60000,
        waitUntil: "networkidle2",
      });

      // Wait for the form to be available
      await page.waitForSelector(".moo", { timeout: 60000 });

      // Fill out the form fields with the provided phone number
      await page.type(".moo", phoneNumber);

      // Click submit button and wait for navigation to /bonus
      await Promise.all([
        page.click('input[type="submit"]'), // Click submit button
        page.waitForNavigation({ waitUntil: "networkidle2" }), // Wait for navigation
      ]);

      console.log("Form submitted successfully and navigated to /bonus.");

      // Navigate directly to /bonus
      await page.goto("https://vieton.site/bonus", {
        waitUntil: "networkidle2",
      });
      console.log("Navigated to /bonus.");

      // Store the page instance
      pages.set(userID, page);
    } else {
      // If page instance already exists, reuse it
      page = pages.get(userID);
      console.log(`Using existing page instance for userID ${userID}`);
    }

    // Set interval to run a function every 61 seconds for each user
    const intervalID = setInterval(async () => {
      try {
        const page = pages.get(userID);

        if (!page) {
          console.log(`Page instance for userID ${userID} does not exist.`);
          clearInterval(intervalID);
          return;
        }

        // Navigate to /get.php
        await page.goto("https://vieton.site/get.php", {
          waitUntil: "networkidle2",
        });

        console.log(
          `Navigated to /get.php for userID ${userID} at`,
          new Date().toLocaleTimeString()
        );
      } catch (error) {
        console.error(
          `Error in periodic function for userID ${userID}:`,
          error
        );
      }
    }, 15000); // 61000 ms = 61 seconds

    res.send("Puppeteer script executed successfully.");
  } catch (error) {
    console.error("Error in Puppeteer script:", error);
    res.status(500).send("Error executing Puppeteer script.");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
