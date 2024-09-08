require('dotenv').config();
const axios = require('axios');

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
          const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/USD`);
          
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

module.exports = {
    switchPublication,
    getRevenue,
    calculateMyShare,
    convertUSDtoGBP
};