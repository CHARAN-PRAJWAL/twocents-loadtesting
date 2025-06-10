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
      // iterations: 1,
      stages: [
        { duration: "1s", target: 1 }, // Ramp up to 10 VUs in 2 minutes
        { duration: "2s", target: 2 }, // Ramp up to 50 VUs in 5 minutes
        { duration: "2s", target: 2 }, // Hold at 50 VUs for 10 minutes
        { duration: "1s", target: 0 }, // Ramp down to 0 VUs in 2 minutes
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
    //await page.click("//a[@href='/business/contact']");
    sleep(5);
    // await check(page.locator("//h1[contains(text(),'Get on suggestly')]"), {
    //   "continue button exist": (el) => el !== null,
    // });
    await page.locator('[class="cursor-pointer"]').click();
    await page.locator("//span[text()='Business Owner Sign Up']").click();
    //input#name,input#businessName,input#city,input#email
    await page.type("input#name", "Ayush");
    await page.type("input#businessName", "Water Park");
    await page.type("input#city", "Delhi");
    await page.type("input#email", "ayushwp@email.com");
    await page.click("button");
    await check(
      page.locator("//div[contains(text(),'Message received. Tom or Drew will reach out ASAP!')]"),
      {
        "continue button exist": (el) => el !== null,
      },
    );
  } finally {
    await page.close();
  }
}
