import { test, expect, type Page, type Locator } from "@playwright/test";

/** Opens `/depgraph`, selects the first combobox result as the graph's root
 * node, and returns its `.react-flow__node` locator. Skips the test if the
 * backend returned no benches to pick from. */
export async function selectFirstBenchAsRoot(page: Page): Promise<Locator> {
  await page.goto("/depgraph");
  const combobox = page.getByRole("combobox", { name: "Select a bench" });
  await expect(combobox).toBeVisible();
  await combobox.click();
  const options = page.getByRole("option");
  test.skip((await options.count()) === 0, "No benches returned by the backend");
  await options.first().click();
  const node = page.locator(".react-flow__node").first();
  await expect(node).toBeVisible();
  return node;
}
