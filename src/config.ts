import dotenv from "dotenv";
dotenv.config();

export class Config {
  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  static readonly OPENAI_MODEL = process.env.OPENAI_MODEL;
  static readonly GEMINI_MODEL = process.env.GEMINI_MODEL;
  static readonly INITIAL_PROVIDER = process.env.INITIAL_PROVIDER;
  static readonly OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD;

  static readonly SERVER = process.env.SERVER;
  static readonly PORT = process.env.PORT;

  static readonly PROMPT_FILE = process.env.PROMPT_FILE;
  static readonly SLICE_SIZE = parseInt(process.env.SLICE_SIZE ?? "10");
}
