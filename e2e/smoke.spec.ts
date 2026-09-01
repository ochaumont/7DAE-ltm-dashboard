import { test, expect } from "@playwright/test";

// Backend-independent checks — pass whether or not `atom-synchronizer-dev`
// is reachable (the app shows a friendly error screen on backend failure
// rather than crashing, so these only assert on chrome that's always there).

test("health endpoint responds ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ status: "ok" });
});

test("main navigation is present on the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /go to catalogue/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Map" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dependency Graph" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dependency View" })).toBeVisible();
});
