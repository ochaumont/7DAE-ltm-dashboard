import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const COUNT_RE = /(\d+)\s*\/\s*(\d+)\s*lab test means/;

async function readCountText(page: Page): Promise<string> {
  return page.getByText(COUNT_RE).innerText();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
});

test("filters survive navigating to a detail page and back", async ({ page }) => {
  await page
    .getByRole("radiogroup", { name: "Photo filter" })
    .getByRole("radio", { name: "With photo" })
    .click();
  const filteredCount = await readCountText(page);

  const cards = page.locator('main section a[href^="/labtestmean?id="]');
  test.skip((await cards.count()) === 0, "No results to open under this filter");

  await cards.first().click();
  await expect(page).toHaveURL(/\/labtestmean\?id=/);

  await page.goBack();
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);
});

test("clicking the Catalogue nav link resets filters", async ({ page }) => {
  await page
    .getByRole("radiogroup", { name: "Photo filter" })
    .getByRole("radio", { name: "With photo" })
    .click();

  await page.getByRole("link", { name: "Catalogue" }).click();
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();

  const resetText = await readCountText(page);
  const [, resetShown, resetTotal] = COUNT_RE.exec(resetText)!;
  expect(resetShown).toBe(resetTotal); // no filter active => shown === total
});
