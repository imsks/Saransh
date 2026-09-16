import pino from "pino";

const level =
  process.env.NEXT_PUBLIC_LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/** Application logger for the Saransh web app. Works in both SSR and the browser. */
export const logger = pino({
  name: "saransh-web",
  level,
  browser: { asObject: true },
});
