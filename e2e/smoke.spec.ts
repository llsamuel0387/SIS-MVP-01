import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home shows hero copy and portal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Student Information System Demo").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Student Portal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Staff Portal" })).toBeVisible();
  });

  test("student login shows portal chrome and sign-in control", async ({ page }) => {
    await page.goto("/studentportal/login");
    await expect(page.getByText("Student Portal").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /secure sign in/i })).toBeVisible();
  });

  test("unauthenticated /studentportal redirects to login", async ({ page }) => {
    await page.goto("/studentportal");
    await expect(page).toHaveURL(/\/studentportal\/login$/);
  });
});
