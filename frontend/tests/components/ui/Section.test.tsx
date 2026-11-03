import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import { Container, Section, SectionHeader } from "@/components/ui";

afterEach(cleanup);

describe("Container", () => {
  it("uses the wide column by default and the narrow one on request", () => {
    const { container, rerender } = render(<Container>Body</Container>);
    expect(container.firstElementChild?.className).toContain("max-w-[1120px]");

    rerender(<Container size="narrow">Body</Container>);
    expect(container.firstElementChild?.className).toContain("max-w-[720px]");
  });
});

describe("Section", () => {
  it("renders a labelled section around a container", () => {
    render(
      <Section id="part" aria-labelledby="part-title">
        <h2 id="part-title">Part</h2>
      </Section>,
    );

    const section = screen.getByRole("region", { name: "Part" });
    expect(section.id).toBe("part");
    expect(section.firstElementChild?.className).toContain("max-w-[1120px]");
  });
});

describe("SectionHeader", () => {
  it("renders eyebrow, heading and lead", () => {
    render(<SectionHeader id="t" eyebrow="Open source" title="Built in the open." lead="Lead text" />);

    const heading = screen.getByRole("heading", { level: 2, name: "Built in the open." });
    expect(heading.id).toBe("t");
    expect(screen.getByText("Open source").className).toContain("text-muted");
    expect(screen.getByText("Lead text")).toBeTruthy();
  });

  it("applies the eyebrow tone and centre alignment", () => {
    const { container } = render(
      <SectionHeader eyebrow="Planned" eyebrowTone="info" title="Title" align="center" />,
    );

    expect(screen.getByText("Planned").className).toContain("text-blue");
    expect(container.firstElementChild?.className).toContain("text-center");
  });

  it("omits the eyebrow and lead when not given", () => {
    const { container } = render(<SectionHeader title="Only a title" />);

    expect(container.firstElementChild?.children).toHaveLength(1);
    expect(container.firstElementChild?.className).not.toContain("text-center");
  });
});
