// Import the required modules
const { test, expect } = require('@playwright/test');
const { Solver } = require('@2captcha/captcha-solver');
const axios = require('axios');

// Initialize the captcha solver
const solver = new Solver('0a197088ba9be335419793350ff754b9');
const API_KEY = '81eebc2933da649649b34c70'; 

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

  // Navigate to the login page
  await page.goto('https://app.beehiiv.com/login');

  // Fill login form
  await page.fill('input[name="email"]', 'grind4future1@gmail.com');
  await page.fill('input[name="password"]', 'Agency1234!');

  // Click the submit button
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  // Perform revenue check
  const grindRevenue = await getRevenue(page, "Grind4Future");
  const calculatedGrindRev = await calculateMyShare(grindRevenue, 40);
  // console.log("Grind - My Share: ", calculatedGrindRev);

  // Become Alpha Male page
  await switchPublication(page, 0);

  // Perform revenue check again
  const alphamaleRevenue = await getRevenue(page, "BecomeAlphaMale");
  const calculatedAlphaRev = await calculateMyShare(alphamaleRevenue, 50);
  // console.log("Alpha - My Share: ", calculatedAlphaRev);

  // Vigor page
  await switchPublication(page, 2);

  // Perform revenue check again
  const vigorRevenue = await getRevenue(page, "Vigor");
  const calculatedVigorRev = await calculateMyShare(vigorRevenue, 100);
  // console.log("Alpha - My Share: ", calculatedVigorRev);

  const totalRevenue = calculatedAlphaRev + calculatedGrindRev + calculatedVigorRev;
  const totalRevenueInPounds = await convertUSDtoGBP(totalRevenue);
  const formattedRevenue = totalRevenueInPounds.toFixed(2);

  console.log("Total Revenue Today: ", formattedRevenue);
});

async function switchPublication(page, order){
  // Navigate to settings
  await page.goto('https://app.beehiiv.com/settings/company/publications');

  // Click on the publication and edit
  await page.locator('div.bg-white.border.rounded-full.h-8.w-8.flex.items-center.justify-center').nth(order).click();
  await page.click('button:has-text("Edit")');
}

async function getRevenue(page, publicationNameForLog) {
  // Navigate to the monetize page
  await page.goto('https://app.beehiiv.com/monetize/boosts');

  // Click on Insights and select time period
  await page.click('span:has-text("Insights")');
  await page.waitForTimeout(5000);
  await page.click('button.shadow-sm.flex.h-9.items-center.justify-between.text-left.border-surface-200.text-gray-900.rounded-md');
  await page.waitForTimeout(5000);
  await page.click('button:has-text("Last 24 hours")');
  await page.waitForTimeout(4000);

  // Wait for revenue elements to be visible
  await page.waitForSelector('span.sc-fUnMCh.gvGeRj.text-base.text-surface-700.font-normal');
  await page.waitForSelector('span.sc-fUnMCh.gvGeRj.text-3xl.text-feedback-success-600.font-bold');

  // Extract revenue value
  const revenueText = await page.textContent('span.sc-fUnMCh.gvGeRj.text-3xl.text-feedback-success-600.font-bold');

  // Convert to number
  const revenue = parseFloat(revenueText);
  console.log(`Revenue for ${publicationNameForLog}:`, revenue);
  return revenue;
}

async function calculateMyShare(rawRevenue, percentage){
  const myShare = rawRevenue * (percentage / 100);
  myShare.toFixed(2);
  console.log(myShare);
  return myShare;
}

async function convertUSDtoGBP(amountUSD) {
    try {
        // Fetch exchange rate from USD to GBP
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
        
        // Extract the exchange rate for GBP
        const exchangeRate = response.data.conversion_rates.GBP;
        
        // Convert the amount
        const amountGBP = amountUSD * exchangeRate;
        
        console.log(`Amount in USD: $${amountUSD}`);
        console.log(`Converted amount in GBP: £${amountGBP.toFixed(2)}`);
        return amountGBP;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
    }
}
