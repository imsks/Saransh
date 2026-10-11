import { describe, expect, it } from "@jest/globals";

import { logger } from "@/lib/logger";

describe("logger", () => {
  it("tags records with the web service name", () => {
    expect(logger.bindings().name).toBe("saransh-web");
  });

  it("defaults to debug outside production", () => {
    expect(logger.level).toBe("debug");
  });
});
