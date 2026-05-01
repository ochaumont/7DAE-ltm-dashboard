import { test, expect } from "@playwright/test";

const SAMPLE_LTMS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    externalId: "V_TEST_01",
    name: "Test Bench Alpha",
    category: "sib",
    complexity: "medium",
    country: "Fr",
    site: "TLS",
    building: "C_51_3",
    room: "4m Level",
    description: "A bench used for smoke testing.",
    shortDescription: null,
    kickoff: "2020",
    eisdateyear: "2021",
    mothballed: null,
    dismantled: null,
    managers: [
      { id: "m1", externalId: "alice@example.com", name: "Alice Manager" },
    ],
    architects: [],
    projectManagers: [],
    workPakageLeaders: [],
    leadEngineers: [],
    deputies: [],
    depts: [],
    ecLevel: null,
    networkSegregated: true,
    accesscontrol: true,
    accesbadge: null,
    accreditation: [],
    financeAircraftPrograms: [{ name: "SA" }],
    financeProjects: [],
    documentRefs: [],
  },
];

const SAMPLE_LTM = SAMPLE_LTMS[0];

test.beforeEach(async ({ context }) => {
  // Mock the ATOM API so the suite is offline-stable.
  await context.route(
    "http://localhost:8080/atom-synchronizer-dev/api/infos/labtestmeans",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SAMPLE_LTMS),
      }),
  );
  await context.route(
    /\/api\/infos\/labtestmeans\/[^/?]+$/,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SAMPLE_LTM),
      }),
  );
});

test("catalog page loads with at least one card", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
  await expect(page.getByText(SAMPLE_LTM.name).first()).toBeVisible();
});

test("detail page loads via card click", async ({ page }) => {
  await page.goto("/");
  await page.getByText(SAMPLE_LTM.name).first().click();
  await expect(page).toHaveURL(/\/labtestmean\/V_TEST_01$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    SAMPLE_LTM.name,
  );
  await expect(page.getByText("LOCATION")).toBeVisible();
});

test("map page renders MapLibre canvas", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({
    timeout: 15_000,
  });
});

test("theme toggle switches data-theme attribute", async ({ page }) => {
  await page.goto("/");
  const initial = await page
    .locator("html")
    .getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to/i }).click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    initial ?? "dark",
  );
});
