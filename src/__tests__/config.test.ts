import { Config } from "../config";

describe("Config", () => {
  const requiredEnvVars = [
    "OPENAI_MODEL",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
    "INITIAL_PROVIDER",
    "OPERATOR_PASSWORD",
  ];

  it.each(requiredEnvVars)("should have %s defined", (envVar) => {
    const value = Config[envVar as keyof typeof Config];
    expect(value).toBeDefined();
    expect(value).not.toBeNull();
  });

  it("should have valid values for all properties", () => {
    const configValues = Object.entries(Config);
    expect(configValues.length).toBeGreaterThan(0);

    for (const [key, value] of configValues) {
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      expect(typeof value).toBe("string");
    }
  });
});
