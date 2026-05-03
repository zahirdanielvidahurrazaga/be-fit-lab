const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  console.log('Navigating to login...');
  await page.goto('http://localhost:5174/login', {waitUntil: 'networkidle2'});
  console.log('Typing credentials...');
  await page.type('input[type=email]', 'cliente@gmail.com');
  await page.type('input[type=password]', 'Vida2003');
  await page.click('button[type=submit]');
  console.log('Waiting for navigation...');
  await page.waitForNavigation({waitUntil: 'networkidle2'});
  console.log('Navigated to:', page.url());
  // Wait a bit to ensure Admin page renders
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
