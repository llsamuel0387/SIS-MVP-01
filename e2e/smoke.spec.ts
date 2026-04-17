import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home shows hero copy and portal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero-module-badge")).toHaveText("Student Information System Demo");
    await expect(page.locator(".hero-module-title")).toHaveText("Student Information System Demo");
    // Links wrap `<button>` children; the accessible name lives on the button, not the anchor.
    await expect(page.getByRole("button", { name: "Student Portal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Staff Portal" })).toBeVisible();
  });

  test("student login shows portal chrome and sign-in control", async ({ page }) => {
    await page.goto("/studentportal/login");
    await expect(page.locator(".login-hero-card .ui-badge")).toHaveText("Student Portal");
    await expect(page.getByRole("button", { name: /secure sign in/i })).toBeVisible();
  });

  test("unauthenticated /studentportal redirects to login", async ({ page }) => {
    await page.goto("/studentportal");
    await expect(page).toHaveURL(/\/studentportal\/login$/);
  });
});
