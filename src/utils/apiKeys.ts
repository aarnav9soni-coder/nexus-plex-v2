import { getSafeApiKey } from "./envConfig";

export function getApiKey(keyName: string): string {
  return getSafeApiKey(keyName);
}

export const API_KEYS = {
  get GEMINI() {
    return getSafeApiKey("GEMINI_API_KEY");
  },
  get REPLICATE() {
    return getSafeApiKey("REPLICATE_API_KEY");
  },
  get STABILITY() {
    return getSafeApiKey("STABILITY_API_KEY");
  },
  get POLLINATIONS() {
    return getSafeApiKey("POLLINATIONS_API_KEY");
  },
};
