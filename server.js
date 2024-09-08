require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');
const { Solver } = require('@2captcha/captcha-solver');
const { switchPublication, getRevenue, calculateMyShare, convertUSDtoGBP } = require('./helper-functions/helperFunctions');

const app = express();
const port = process.env.PORT || 3000;

const solver = new Solver(process.env.CAPTCHA_KEY);

// API endpoint to get total revenue in pounds
app.get('/get-revenue', async (req, res) => {
    try {

      console.log("Starting revenue calculation...");
      res.status(500).json({ message: 'starting rev calculation' });
      const browser = await chromium.launch({ headless: false });
      res.status(500).json({ message: 'opened browser' });
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();
      await page.addInitScript({ path: './inject.js' });
      res.status(500).json({ message: 'added script' });
  
      page.on('console', async (msg) => {
        const txt = msg.text();
        if (txt.includes('intercepted-params:')) {
          const params = JSON.parse(txt.replace('intercepted-params:', ''));
          try {
            console.log("Solving captcha...");
            res.status(500).json({ message: 'Solving Captchha' });
            const res = await solver.cloudflareTurnstile(params);
            console.log(`Captcha solved: ${res.id}`);
            res.status(500).json({ message: 'Solving Captcha' });
            await page.evaluate((token) => {
              cfCallback(token);
            }, res.data);
          } catch (e) {
            console.error("Captcha solver error:", e);
            res.status(500).json({ error: 'Captcha solver error' });
            return;
        }
        }
      });
  
      await page.goto('https://app.beehiiv.com/login');
      await page.fill('input[name="email"]', process.env.EMAIL);
      await page.fill('input[name="password"]', process.env.PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
      console.log("Logged in!");
  
      const grindRevenue = await getRevenue(page, "Grind4Future");
      const calculatedGrindRev = await calculateMyShare(grindRevenue, 40);
      console.log("Calculated Grind: ", calculatedGrindRev);
  
      await switchPublication(page, 0);
  
      const alphamaleRevenue = await getRevenue(page, "BecomeAlphaMale");
      const calculatedAlphaRev = await calculateMyShare(alphamaleRevenue, 50);
  
      await switchPublication(page, 2);
  
      const vigorRevenue = await getRevenue(page, "Vigor");
      const calculatedVigorRev = await calculateMyShare(vigorRevenue, 100);
  
      const totalRevenue = calculatedAlphaRev + calculatedGrindRev + calculatedVigorRev;
      const totalRevenueInPounds = await convertUSDtoGBP(totalRevenue);
  
      await browser.close();
      res.json({ totalRevenue: totalRevenueInPounds.toFixed(2) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate revenue' });
    }
  });
  
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
