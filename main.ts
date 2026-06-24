import Holidays from "npm:date-holidays";
import { Hono } from "npm:hono";
import ical from "npm:ical-generator";
import readme from "./README.md" with { type: "text" };

const app = new Hono();

app.get("/", (c) => {
  return c.text(readme);
});

app.get("/:location", (c) => {
  const location = c.req
    .param("location")
    .toUpperCase()
    .replace(/[.]ICS$/, "");

  const holidays = new Holidays(location);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const holidayData = [
    ...holidays.getHolidays(currentYear),
    ...holidays.getHolidays(nextYear),
  ].filter((p) => p.type === "public");

  if (holidayData.length === 0) {
    return c.text(`No holidays available for ${location}.`, 404);
  }

  const calendar = ical({
    name: `${location} Public Holidays`,
  });

  holidayData.forEach((holiday) => {
    calendar.createEvent({
      start: holiday.date,
      allDay: true,
      summary: holiday.name,
      location,
    });
  });

  c.header("content-type", "text/calendar");

  return c.body(calendar.toString());
});

Deno.serve(app.fetch);
