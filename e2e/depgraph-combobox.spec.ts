import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/depgraph");
  await expect(page.getByRole("combobox", { name: "Select a bench" })).toBeVisible();
});

test("typing narrows the option list and selecting one adds a graph node", async ({ page }) => {
  const combobox = page.getByRole("combobox", { name: "Select a bench" });

  await combobox.click();
  const options = page.getByRole("option");
  const totalOptions = await options.count();
  test.skip(totalOptions === 0, "No benches returned by the backend");

  const firstLabel = (await options.first().innerText()).trim();
  const query = firstLabel.slice(0, Math.min(3, firstLabel.length));

  await combobox.fill(query);
  const narrowedCount = await options.count();
  expect(narrowedCount).toBeGreaterThan(0);
  expect(narrowedCount).toBeLessThanOrEqual(totalOptions);

  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await options.first().click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
});
