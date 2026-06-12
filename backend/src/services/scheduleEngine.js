function isInPeriod(date, start, end) {
  if (!start || !end) return false;
  return date >= new Date(start) && date <= new Date(end);
}

function generateSchedule({
  semesterStart,
  semesterEnd,
  christmasStart, christmasEnd,
  easterStart, easterEnd,
  readingWeek1Start, readingWeek1End,
  readingWeek2Start, readingWeek2End,
  moduleId,
  academicYear
}) {
  const sessions = [];
  let current = new Date(semesterStart);
  const end = new Date(semesterEnd);
  let weekNumber = 1;

  const isHoliday = (date) =>
    isInPeriod(date, christmasStart, christmasEnd) ||
    isInPeriod(date, easterStart, easterEnd) ||
    isInPeriod(date, readingWeek1Start, readingWeek1End) ||
    isInPeriod(date, readingWeek2Start, readingWeek2End);

  while (current <= end) {
    if (!isHoliday(current)) {
      sessions.push({
        academic_year: academicYear,
        module_id: moduleId,
        week_number: weekNumber,
        session_date: current.toISOString().split('T')[0],
        topic: `Week ${weekNumber} — TBC`
      });
      weekNumber++;
    }
    current.setDate(current.getDate() + 7);
  }

  return sessions;
}

module.exports = { generateSchedule };
