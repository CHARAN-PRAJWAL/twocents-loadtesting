import { check, sleep } from "k6";
import { browser } from "k6/browser";

export const options = {
  scenarios: {
    ui: {
      executor: "ramping-vus", // Gradually ramp up and down virtual users
      options: {
        browser: {
          type: "chromium", // Use Chromium browser
        },
      },
      stages: [
        { duration: "20s", target: 15 }, // Ramp up to 10 VUs in 2 minutes
        { duration: "30s", target: 20 }, // Ramp up to 50 VUs in 5 minutes
        { duration: "30s", target: 20 }, // Hold at 50 VUs for 10 minutes
        { duration: "10s", target: 0 }, // Ramp down to 0 VUs in 2 minutes
      ],
    },
  },
  thresholds: {
    checks: ["rate==1.0"], // Ensure all checks pass
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    await page.goto(`${__ENV.BASEURL}`);
    await page.click("//h2[contains(text(),'Grape Collective')]/parent::div/parent::div/div/a");
    await page.waitForSelector("//div/button[contains(text(),'Product Selection')]", { state: "visible" });
    await page.click("//div/button[contains(text(),'Product Selection')]");
    await page.click("//div/button[contains(text(),'Pricing')]");
    sleep(1);
    await page.click("button.whitespace-nowrap");
    await page.waitForSelector("form textarea", { state: "visible" });
    await page.fill("form textarea", "Test Test");
    sleep(5);
    await page.click("button.whitespace-nowrap");
    await page.waitForSelector("div#dragArrow img", { state: "visible" });
    await page.click("img[alt='Bulbmoji happy']");
    sleep(2);
    await page.click("//button[contains(text(),'Submit')]");
    await page.click("//button[contains(text(),'Submit')]");
    await page.waitForSelector("//a[contains(text(),'Continue')]", {
      state: "visible",
    });
    await check(page.locator("//a[contains(text(),'Continue')]"), {
      "continue button exist": (el) => el !== null,
    });
  } finally {
    await page.close();
  }
}
