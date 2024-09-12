// Import the required modules
const { test, expect } = require('@playwright/test');
const { Solver } = require('@2captcha/captcha-solver');
const axios = require('axios');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Initialize the captcha solver
const solver = new Solver('0a197088ba9be335419793350ff754b9');
const API_KEY = '81eebc2933da649649b34c70';
const repoURL = 'https://github.com/Amir-git-dev/Beehiiv-Store.git';

// Test case
test('Example test case', async ({ page }) => {
  test.slow();
  
  // Setup the context
  await page.addInitScript({ path: './inject.js' });

  page.on('console', async (msg) => {
    const txt = msg.text();
    if (txt.includes('intercepted-params:')) {
      const params = JSON.parse(txt.replace('intercepted-params:', ''));
      console.log(params);

      try {
        console.log(`Solving the captcha...`);
        const res = await solver.cloudflareTurnstile(params);
        console.log(`Solved the captcha ${res.id}`);
        console.log(res);
        await page.evaluate((token) => {
          cfCallback(token);
        }, res.data);
      } catch (e) {
        console.log(e.err);
        process.exit();
      }
    }
  });

  // Login and navigate through various pages
  await loginAndNavigate(page);

  // Perform revenue checks and calculate totals
  const formattedRevenue = await performRevenueChecks(page);

  // Update the XML file with the calculated revenue and commit the changes
  await updateXMLAndCommit(formattedRevenue);
});

async function loginAndNavigate(page) {
  // Navigate to the login page
  await page.goto('https://app.beehiiv.com/login');

  // Fill login form
  await page.fill('input[name="email"]', 'grind4future1@gmail.com');
  await page.fill('input[name="password"]', 'Agency1234!');

  // Click the submit button
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
}

async function performRevenueChecks(page) {
  const grindRevenue = await getRevenue(page, "Grind4Future");
  const calculatedGrindRev = await calculateMyShare(grindRevenue, 40);

  await switchPublication(page, 0);
  const alphamaleRevenue = await getRevenue(page, "BecomeAlphaMale");
  const calculatedAlphaRev = await calculateMyShare(alphamaleRevenue, 50);

  await switchPublication(page, 2);
  const vigorRevenue = await getRevenue(page, "Vigor");
  const calculatedVigorRev = await calculateMyShare(vigorRevenue, 100);

  const totalRevenue = calculatedAlphaRev + calculatedGrindRev + calculatedVigorRev;
  const totalRevenueInPounds = await convertUSDtoGBP(totalRevenue);
  const formattedRevenue = totalRevenueInPounds.toFixed(2);

  console.log("Total Revenue Today: ", formattedRevenue);
  return formattedRevenue;  // Return the calculated revenue
}

async function switchPublication(page, order) {
  await page.goto('https://app.beehiiv.com/settings/company/publications');
  await page.locator('div.bg-white.border.rounded-full.h-8.w-8.flex.items-center.justify-center').nth(order).click();
  await page.click('button:has-text("Edit")');
}

async function getRevenue(page, publicationNameForLog) {
  await page.goto('https://app.beehiiv.com/monetize/boosts');
  await page.click('span:has-text("Insights")');
  await page.waitForTimeout(5000);
  await page.click('button.shadow-sm.flex.h-9.items-center.justify-between.text-left.border-surface-200.text-gray-900.rounded-md');
  await page.waitForTimeout(5000);
  await page.click('button:has-text("Last 24 hours")');
  await page.waitForTimeout(4000);
  await page.waitForSelector('span.sc-fUnMCh.gvGeRj.text-3xl.text-feedback-success-600.font-bold');
  
  const revenueText = await page.textContent('span.sc-fUnMCh.gvGeRj.text-3xl.text-feedback-success-600.font-bold');
  const revenue = parseFloat(revenueText);
  console.log(`Revenue for ${publicationNameForLog}:`, revenue);
  return revenue;
}

async function calculateMyShare(rawRevenue, percentage) {
  const myShare = rawRevenue * (percentage / 100);
  console.log(myShare.toFixed(2));
  return myShare;
}

async function convertUSDtoGBP(amountUSD) {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
    const exchangeRate = response.data.conversion_rates.GBP;
    const amountGBP = amountUSD * exchangeRate;
    console.log(`Converted amount in GBP: £${amountGBP.toFixed(2)}`);
    return amountGBP;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
  }
}

async function updateXMLAndCommit(formattedRevenue) {
  const git = simpleGit();
  const repoDir = 'beehiiv-store';

  try {
    // Check if the directory already exists
    if (!fs.existsSync(repoDir)) {
      // Clone the repository if the directory does not exist
      await git.clone(repoURL, repoDir);
      console.log('Repository cloned successfully.');
    } else {
      // If the directory exists, navigate into it and pull the latest changes
      await git.cwd(repoDir);
      await git.pull('origin', 'main');
      console.log('Repository pulled successfully.');
    }

    // Define the path to the XML file
    const xmlFilePath = path.join(repoDir, 'rss.xml');
    
    // Read and modify the XML file
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');

    // Parse XML to JSON
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xmlObj = await parser.parseStringPromise(xmlContent);

    // Modify <data1> value
    if (xmlObj && xmlObj.data && xmlObj.data.data1) {
      xmlObj.data.data1[0] = formattedRevenue;  // Update the value of <data1>
    } else {
      console.log('Error: <data1> tag not found.');
      return;
    }

    // Convert back to XML
    const updatedXML = builder.buildObject(xmlObj);
    
    // Write the updated XML to the file
    fs.writeFileSync(xmlFilePath, updatedXML, 'utf-8');
    console.log('XML file modified successfully.');

    // Commit and push the changes
    await git.add('rss.xml');
    await git.commit(`Update <data1> tag with revenue: ${formattedRevenue}`);
    await git.push('origin', 'main');
    console.log('Changes committed and pushed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
