import { DateTime } from "luxon";
import { config } from "../config.js";

export function nowTz() {
  return DateTime.now().setZone(config.tz).startOf("day");
}

export function remainingDays(expiry: Date) {
  const diff = DateTime.fromJSDate(expiry).setZone(config.tz).startOf("day").diff(nowTz(), "days").days;
  return Math.floor(diff);
}

export function serviceYears(joining: Date) {
  const diff = nowTz().diff(DateTime.fromJSDate(joining).setZone(config.tz), "years").years;
  return Math.max(0, Math.floor(diff));
}
