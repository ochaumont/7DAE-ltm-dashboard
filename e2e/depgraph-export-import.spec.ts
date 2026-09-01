import { test, expect } from "@playwright/test";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

test("exporting the active diagram and re-importing it restores its nodes", async ({ page }) => {
  await selectFirstBenchAsRoot(page);
  const nodeCountBefore = await page.locator(".react-flow__node").count();

  await page.getByRole("button", { name: "..." }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export" }).click(),
  ]);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Select a bench" })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);

  // Setting files directly on the hidden <input type="file"> fires the same
  // onChange handler a real file-picker selection would, without needing to
  // click the "Import" menu item first (which only opens the OS picker).
  await page.locator('input[type="file"]').setInputFiles(filePath!);

  const importDialog = page.getByRole("dialog", { name: "Import diagram" });
  await expect(importDialog).toBeVisible();
  const importName = `e2e-import-${Date.now()}`;
  await importDialog.locator('input[type="text"]').fill(importName);
  await importDialog.getByRole("button", { name: "Import" }).click();
  await expect(importDialog).toBeHidden();

  // Importing only adds the diagram to the saves list (`writeSave`) — it
  // doesn't load it into the active graph, so load it explicitly to verify
  // its content round-tripped through export -> import correctly.
  await page.getByRole("button", { name: "..." }).click();
  await page.getByRole("menuitem", { name: "Load" }).click();
  const loadDialog = page.getByRole("dialog", { name: "Load" });
  await loadDialog.getByRole("button", { name: importName, exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(nodeCountBefore);

  // Cleanup: remove the save this test created.
  await page.getByRole("button", { name: "..." }).click();
  await page.getByRole("menuitem", { name: "Load" }).click();
  await page.getByRole("dialog", { name: "Load" }).getByRole("button", {
    name: `Delete ${importName}`,
  }).click();
});
