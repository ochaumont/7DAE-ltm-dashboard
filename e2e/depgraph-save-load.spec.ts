import { test, expect } from "@playwright/test";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

test("saving a diagram, reloading, then loading it restores the same node count", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);
  const nodeCountBefore = await page.locator(".react-flow__node").count();

  const saveName = `e2e-save-${Date.now()}`;

  await page.getByRole("button", { name: "..." }).click();
  await page.getByRole("menuitem", { name: "Save as new" }).click();

  const saveDialog = page.getByRole("dialog", { name: "Save as new" });
  await saveDialog.getByPlaceholder("Save name…").fill(saveName);
  await saveDialog.getByRole("button", { name: "Save" }).click();
  await expect(saveDialog).toBeHidden();

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Select a bench" })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);

  await page.getByRole("button", { name: "..." }).click();
  await page.getByRole("menuitem", { name: "Load" }).click();

  const loadDialog = page.getByRole("dialog", { name: "Load" });
  await loadDialog.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(nodeCountBefore);

  // Cleanup: remove the save this test created so repeated runs don't pile up.
  await page.getByRole("button", { name: "..." }).click();
  await page.getByRole("menuitem", { name: "Load" }).click();
  await page.getByRole("dialog", { name: "Load" }).getByRole("button", {
    name: `Delete ${saveName}`,
  }).click();
});
