import { readPrompts } from "../prompts";

describe("Prompts", () => {
    it("should read prompts", () => {
        const prompts = readPrompts();
        expect(prompts).toBeDefined();
        expect(prompts.basic).toBeDefined();
        const basic = prompts.basic as any;
        expect(basic.system_message).toBeDefined();
        expect(typeof basic.system_message === "string").toBeTruthy();
    });
});

