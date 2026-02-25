/**
 * Converts a time string ("HH:MM" or "HH:MM:SS") to minutes since midnight.
 */
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to a "HH:MM" string.
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Adds N minutes to a time string, returns "HH:MM".
 */
function addMinutes(timeStr, minutes) {
  const total = timeToMinutes(timeStr) + minutes;
  return minutesToTime(total);
}

/**
 * Returns true if time1 is before time2 (both in "HH:MM" or "HH:MM:SS" format).
 */
function isTimeBefore(time1, time2) {
  return timeToMinutes(time1) < timeToMinutes(time2);
}

/**
 * Checks if time is within [start, end) — inclusive start, exclusive end.
 */
function isTimeInRange(time, start, end) {
  const t = timeToMinutes(time);
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  return t >= s && t < e;
}

/**
 * Generates an array of { start, end } slot objects from startTime to endTime
 * with each slot lasting durationMinutes.
 */
function generateTimeSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  let currentStart = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  while (currentStart + durationMinutes <= endMins) {
    const currentEnd = currentStart + durationMinutes;
    slots.push({
      start: minutesToTime(currentStart),
      end: minutesToTime(currentEnd),
    });
    currentStart = currentEnd;
  }

  return slots;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  addMinutes,
  isTimeBefore,
  isTimeInRange,
  generateTimeSlots,
};
