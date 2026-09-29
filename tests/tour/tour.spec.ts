import { expect, test, type Page } from "@playwright/test";
import { LIONS_GAME_ROUTE, TOUR_CHAPTERS, type TourStep } from "../../src/content/tour/chapters";

/**
 * The tour's safety net: for every chapter, open its route and check that each step's `data-tour` anchor becomes
 * visible after the step's `before` action. Add a step to src/content/tour/chapters.ts and this covers it.
 */

const visible = (page: Page, selector: string) => page.locator(selector).filter({ visible: true }).first();

async function resolveRoute(page: Page, route: string): Promise<string> {
  if (route !== LIONS_GAME_ROUTE) return route;
  let href = "";
  // Retried: the first hit on a cold dev server compiles the route.
  await expect(async () => {
    const response = await page.request.get("/api/tour/lions-game");
    expect(response.ok(), "/api/tour/lions-game should find a completed Lions game").toBeTruthy();
    href = ((await response.json()) as { href: string }).href;
  }).toPass({ timeout: 45_000 });
  return href;
}

/** Mirrors runBeforeAction in src/lib/tour/dom.ts, with real clicks. */
async function runBefore(page: Page, before: TourStep["before"]) {
  const actions = before === undefined ? [] : typeof before === "string" ? [before] : before;
  for (const action of actions) {
    const [kind, ...rest] = action.split(":");
    const arg = rest.join(":");
    if (kind === "click" || kind === "off") {
      const target = visible(page, arg);
      await target.waitFor();
      const on = await target.evaluate(
        (el) =>
          ["on", "active"].includes(el.getAttribute("data-state") ?? "") ||
          el.getAttribute("aria-pressed") === "true" ||
          el.getAttribute("aria-selected") === "true",
      );
      if (kind === "click" ? !on : on) await target.click();
    } else if (kind === "atlas-focus") {
      await page.locator('[data-tour="atlas-map"]').waitFor();
      await page.evaluate(
        (teamId) => window.dispatchEvent(new CustomEvent("atlas:focus", { detail: { teamId } })),
        arg === "none" ? null : arg,
      );
    } else {
      throw new Error(`Unknown tour action "${action}"`);
    }
  }
}

test.describe("every tour step has an anchor on screen", () => {
  for (const chapter of TOUR_CHAPTERS) {
    test(`${chapter.id}: ${chapter.title}`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      let current: string | null = null;
      for (const [index, step] of chapter.steps.entries()) {
        const route = await resolveRoute(page, step.route ?? chapter.route);
        if (route !== current) {
          await page.goto(route);
          current = route;
        }
        await runBefore(page, step.before);
        await expect(
          visible(page, step.element),
          `${chapter.id} step ${index + 1} "${step.title}" needs ${step.element} on ${route}`,
        ).toBeVisible();
      }
      expect(pageErrors).toEqual([]);
    });
  }
});

test("the tour runs: start, advance, go back, leave, resume, finish", async ({ page }) => {
  const welcome = TOUR_CHAPTERS[0];
  await page.goto("/tour");
  await page.getByRole("listitem").filter({ hasText: welcome.title }).getByRole("button").click();

  const popover = page.locator(".driver-popover.gridiron-tour");
  await expect(popover).toBeVisible();
  await expect(popover.locator(".driver-popover-title")).toHaveText(welcome.steps[0].title);
  await expect(popover.locator(".driver-popover-progress-text")).toHaveText(`Step 1 of ${welcome.steps.length}`);

  await page.keyboard.press("ArrowRight");
  await expect(popover.locator(".driver-popover-title")).toHaveText(welcome.steps[1].title);
  await page.keyboard.press("ArrowLeft");
  await expect(popover.locator(".driver-popover-title")).toHaveText(welcome.steps[0].title);

  // Esc leaves the tour and remembers the place.
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(page.locator(".driver-overlay")).toHaveCount(0);

  // Walk the rest of the first chapter with the Next button; the last step of the tour says "Finish".
  await page.getByRole("button", { name: "Guided tour" }).click();
  await page.getByRole("menuitem", { name: /Full tour/ }).click();
  await expect(popover.locator(".driver-popover-title")).toHaveText(welcome.steps[0].title);
  for (let i = 0; i < welcome.steps.length - 1; i++) {
    await popover.getByRole("button", { name: "Next" }).click();
    await expect(popover.locator(".driver-popover-title")).toHaveText(welcome.steps[i + 1].title);
  }
  await expect(popover.getByRole("button", { name: "Next chapter" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Finish one chapter: it gets a checkmark in the Tour Center.
  await page.goto("/tour");
  const dataChapter = TOUR_CHAPTERS.find((c) => c.id === "data")!;
  await page.getByRole("listitem").filter({ hasText: dataChapter.title }).getByRole("button").click();
  await expect(popover.locator(".driver-popover-title")).toHaveText(dataChapter.steps[0].title);
  for (let i = 1; i < dataChapter.steps.length; i++) {
    await popover.locator(".driver-popover-next-btn").click();
    await expect(popover.locator(".driver-popover-title")).toHaveText(dataChapter.steps[i].title);
  }
  await expect(popover.locator(".driver-popover-next-btn")).toHaveText("Finish");
  await popover.locator(".driver-popover-next-btn").click();
  await expect(popover).toBeHidden();
  await page.goto("/tour");
  await expect(page.getByRole("listitem").filter({ hasText: dataChapter.title }).getByText("Done")).toBeVisible();
});
