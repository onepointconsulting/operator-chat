import fs from "fs";
import { Config } from "./config";
import toml from "@iarna/toml";

export function readPrompts() {
  const promptFile = Config.PROMPT_FILE;
  if (!promptFile) {
    throw new Error("PROMPT_FILE is not set");
  }
  if (!promptFile.endsWith(".toml")) {
    throw new Error("PROMPT_FILE must be a .toml file");
  }
  const prompts = toml.parse(fs.readFileSync(promptFile, "utf8"));
  return prompts;
}
