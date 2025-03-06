import fs from "fs";
import { Config } from "./config";
import toml from "@iarna/toml";
import { PromtConfig } from "./types";

export function readPrompts(): PromtConfig {
  const promptFile = Config.PROMPT_FILE;
  if (!promptFile) {
    throw new Error("PROMPT_FILE is not set");
  }
  if (!promptFile.endsWith(".toml")) {
    throw new Error("PROMPT_FILE must be a .toml file");
  }
  const prompts = toml.parse(fs.readFileSync(promptFile, "utf8"));
  return prompts as unknown as PromtConfig;
}

export function getInitialQuestions(): string[] {
  return (readPrompts().basic as any).initial_questions ?? 0;
}

export function getMaxHistorySize(): number {
  return (readPrompts().configuration as any).max_history_size;
}
