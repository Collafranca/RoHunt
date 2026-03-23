import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

const appShellPath = resolve(root, "apps/web/src/layouts/AppShell.astro");
const tokensPath = resolve(root, "apps/web/src/styles/tokens.css");
const globalsPath = resolve(root, "apps/web/src/styles/globals.css");
const logoMarkPath = resolve(root, "packages/ui/src/primitives/LogoMark.tsx");
const navPath = resolve(root, "apps/web/src/components/system/AppNav.astro");

describe("web ui shell task 13", () => {
  it("renders shell landmarks and structure", () => {
    expect(existsSync(appShellPath)).toBe(true);

    const source = readFileSync(appShellPath, "utf8");

    expect(source).toMatch(/<html\s+lang="en">/);
    expect(source).toContain("<body>");
    expect(source).toContain('<div class="app-shell">');
    expect(source).toContain('<header class="app-shell__header">');
    expect(source).toContain('<main class="app-shell__content">');
    expect(source).toContain("<slot />");
    expect(source).toContain("<AppNav />");
    expect(source).toContain('href="/" class="app-shell__brand" aria-label="RoHunt home"');

    const headerIndex = source.indexOf("<header");
    const mainIndex = source.indexOf("<main");
    const slotIndex = source.indexOf("<slot");

    expect(headerIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(headerIndex);
    expect(slotIndex).toBeGreaterThan(mainIndex);
  });

  it("defines primary nav links with expected hrefs", () => {
    expect(existsSync(navPath)).toBe(true);

    const source = readFileSync(navPath, "utf8");

    expect(source).toContain('<nav aria-label="Primary">');
    expect(source).toContain("<ul>");
    expect(source).toContain("links.map");
    expect(source).toContain("<a href={link.href}>{link.label}</a>");

    const expectedLinks = [
      { href: "/jobs", label: "Jobs" },
      { href: "/reviews", label: "Reviews" },
      { href: "/scams", label: "Scams" },
    ];

    for (const link of expectedLinks) {
      expect(source).toContain(`{ href: "${link.href}", label: "${link.label}" }`);
    }
  });

  it("provides token variables and global token import", () => {
    expect(existsSync(tokensPath)).toBe(true);
    expect(existsSync(globalsPath)).toBe(true);

    const tokenSource = readFileSync(tokensPath, "utf8");
    const globalSource = readFileSync(globalsPath, "utf8");

    expect(tokenSource).toMatch(/:root\s*\{/);
    expect(tokenSource).toContain("--rh-color-bg");
    expect(tokenSource).toContain("--rh-color-fg");
    expect(tokenSource).toContain("--rh-space-sm");
    expect(tokenSource).toContain("--rh-space-md");
    expect(tokenSource).toContain("--rh-space-lg");
    expect(globalSource).toContain('@import "./tokens.css"');
  });

  it("does not keep an unconsumed LogoMark primitive", () => {
    const appShellSource = readFileSync(appShellPath, "utf8");

    expect(existsSync(logoMarkPath)).toBe(false);
    expect(appShellSource).not.toContain("logo-mark");
  });
});
