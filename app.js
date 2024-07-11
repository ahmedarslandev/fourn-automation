const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");

const app = express();
const port = 3000;
let browser; // Declare browser globally

// Middleware
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Function to start the browsing loop
async function startBrowsing() {
  try {
    while (true) {
      if (browser) {
        await browser.close(); // Close the previous browser instance
        browser = null; // Reset browser variable
      }

      // Launch a new browser instance
      browser = await puppeteer.launch({
        headless: true, // Run in headless mode for actual operation
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--incognito", // Open in incognito mode
        ],
      });

      const page = await browser.newPage();
      await page.setViewport(getRandomViewport()); // Randomize viewport size
      await page.setUserAgent(getRandomUserAgent()); // Randomize user-agent
      await page.setDefaultNavigationTimeout(0);

      // Randomly choose a URL from an array
      const urls = [
        "https://sun-down-studio.vercel.app/",
        "https://sun-down-studio.vercel.app/",
        "https://www.google.com/",
        "https://sun-down-studio.vercel.app/",
        "https://www.github.com/",
      ];
      const randomUrl = urls[Math.floor(Math.random() * urls.length)];

      const response = await page.goto(randomUrl, {
        waitUntil: "networkidle2",
      });

      if (!response || !response.ok()) {
        throw new Error(
          `Failed to load page: ${response ? response.status() : "unknown"}`
        );
      }

      // Check if the current URL is Sun Down Studio
      if (page.url().startsWith("https://sun-down-studio.vercel.app/")) {
        await clickOnAds(page); // Click on ads
        await page.setDefaultTimeout(getRandomInt(20000, 30000)); // Stay on page for 20-30 seconds
      }

      // Perform various interactions randomly
      const actionType = getRandomInt(1, 4); // Random action type: 1 = scroll, 2 = click on ads, 3 = random click, 4 = bounce back
      switch (actionType) {
        case 1:
          // Scroll a random amount
          const scrollAmount = getRandomInt(1000, 7000); // Random scroll amount between 1000 and 7000 pixels
          await page.evaluate((amount) => {
            window.scrollBy(0, amount);
          }, scrollAmount);
          break;
        case 2:
          // Click on ads
          await clickOnAds(page);
          break;
        case 3:
          // Click on a random link or element
          await randomClick(page);
          break;
        case 4:
          // Bounce back to previous page
          await bounceBack(page);
          break;
        default:
          break;
      }

      // Random wait before closing the page
      const waitTime = getRandomInt(5000, 10000); // Random wait time between 5 to 10 seconds
      await page.setDefaultTimeout(waitTime);

      // Close the page
      await page.close();
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle errors as needed
  }
}

// Function to perform random clicks on ads
async function clickOnAds(page) {
  try {
    const adLinks = await page.evaluate(() => {
      const adElements = Array.from(
        document.querySelectorAll('a[href^="https://ads."], a[href*="/ad/"]')
      ); // Example selectors for ads
      return adElements.map((element) => element.href);
    });

    if (adLinks.length > 0) {
      const randomAdLink = adLinks[Math.floor(Math.random() * adLinks.length)];
      await page.goto(randomAdLink, { waitUntil: "networkidle2" });
    }
  } catch (error) {
    console.error("Error clicking on ads:", error);
  }
}

// Function to perform a random click on any link or element
async function randomClick(page) {
  try {
    const links = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("a[href], button")); // Select links and buttons
      return elements.map((element) => element.href || "button-clicked");
    });

    if (links.length > 0) {
      const randomLink = links[Math.floor(Math.random() * links.length)];
      if (randomLink === "button-clicked") {
        await page.click("button"); // Click a random button
      } else {
        await page.goto(randomLink, { waitUntil: "networkidle2" }); // Click a random link
      }
    }
  } catch (error) {
    console.error("Error clicking random link:", error);
  }
}

// Function to simulate bounce back behavior
async function bounceBack(page) {
  try {
    const history = await page.evaluate(() => {
      return window.history.length; // Get the length of the browsing history
    });

    if (history > 1) {
      await page.goBack(); // Go back to the previous page
    }
  } catch (error) {
    console.error("Error bouncing back:", error);
  }
}

// Route to render the form
app.get("/", (req, res) => {
  res.render("index");
});

// Route to handle form submission
app.post("/submit", async (req, res) => {
  // Start the browsing loop when the form is submitted
  startBrowsing();
  res.send("Browsing started. Check console for details.");
});

// Function to generate a random integer within a range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get a random user-agent string
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Function to generate a random viewport size
function getRandomViewport() {
  const viewports = [
    { width: 360, height: 640 }, // Mobile portrait
    { width: 768, height: 1024 }, // Tablet portrait
    { width: 1366, height: 768 }, // Laptop/desktop
    { width: 1920, height: 1080 }, // Large monitor
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
}

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
