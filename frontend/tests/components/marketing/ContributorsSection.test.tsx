import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import ContributorsSection, { type Contributor } from "@/components/marketing/ContributorsSection";
import contributorsData from "@/data/contributors.json";
import { EXTERNAL } from "@/lib/routes";

afterEach(cleanup);

const people: Contributor[] = [
  {
    login: "first",
    avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    html_url: "https://github.com/first",
    contributions: 12,
  },
  {
    login: "second",
    avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
    html_url: "https://github.com/second",
    contributions: 1,
  },
];

describe("ContributorsSection", () => {
  it("is the #contribute anchor the navbar points at", () => {
    const { container } = render(<ContributorsSection contributors={people} />);

    expect(container.querySelector("section#contribute")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Built in the open." })).toBeTruthy();
  });

  it("links each contributor to their GitHub profile with a count", () => {
    render(<ContributorsSection contributors={people} />);

    const list = screen.getByRole("list", { name: "Contributors" });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://github.com/first",
      "https://github.com/second",
    ]);
    expect(links[0].textContent).toBe("@first12 contributions");
    expect(links[1].textContent).toBe("@second1 contribution");
    for (const link of links) {
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("offers the repository and issue tracker", () => {
    render(<ContributorsSection contributors={people} />);

    expect(
      screen.getByRole("link", { name: "Contribute on GitHub" }).getAttribute("href"),
    ).toBe(EXTERNAL.repo);
    expect(screen.getByRole("link", { name: "Browse issues" }).getAttribute("href")).toBe(
      EXTERNAL.issues,
    );
  });

  it("hides the list when there are no contributors", () => {
    render(<ContributorsSection contributors={[]} />);

    expect(screen.queryByRole("list", { name: "Contributors" })).toBeNull();
    expect(screen.getByRole("link", { name: "Contribute on GitHub" })).toBeTruthy();
  });

  it("reads the weekly contributors.json by default", () => {
    render(<ContributorsSection />);

    const list = screen.getByRole("list", { name: "Contributors" });
    expect(within(list).getAllByRole("link")).toHaveLength(contributorsData.length);
  });
});
