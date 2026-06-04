export const APP_NAME = "myClawTeam";
export * from "./upload.js";

export interface AppInfo {
  name: typeof APP_NAME;
  version: string;
  environment: string;
}
