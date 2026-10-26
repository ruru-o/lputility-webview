/**
 * iCalendar (.ics) Exporter for Student Timetable
 */

const DAY_MAP = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU',
};

function pad(num) {
  return String(num).padStart(2, '0');
}

export function generateIcsContent(courses) {
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LPUtility//Student Schedule Maker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:LPUtility Class Schedule',
  ];

  courses.forEach((course, idx) => {
    const dayCode = DAY_MAP[course.day] || 'MO';
    const [startH, startM] = course.startTime.split(':').map((n) => parseInt(n, 10));
    const [endH, endM] = course.endTime.split(':').map((n) => parseInt(n, 10));

    // Choose next upcoming day of week as base date
    const eventDate = new Date();
    const dayIndices = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const targetDay = dayIndices[course.day] ?? 1;
    const currentDay = eventDate.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    eventDate.setDate(eventDate.getDate() + diff);

    const year = eventDate.getFullYear();
    const month = pad(eventDate.getMonth() + 1);
    const day = pad(eventDate.getDate());

    const dtStart = `${year}${month}${day}T${pad(startH)}${pad(startM)}00`;
    const dtEnd = `${year}${month}${day}T${pad(endH)}${pad(endM)}00`;
    const uid = `lputility-${Date.now()}-${idx}@lyceum.ph`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${dtStamp}`);
    ics.push(`DTSTART:${dtStart}`);
    ics.push(`DTEND:${dtEnd}`);
    ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`);
    ics.push(`SUMMARY:${course.name || course.code}`);
    ics.push(`DESCRIPTION:Course: ${course.name}\\nCode: ${course.code || ''}\\nInstructor: ${course.instructor || 'N/A'}`);
    ics.push(`LOCATION:${course.room || 'TBA'}`);
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export function downloadIcsFile(courses, filename = 'lputility-schedule.ics') {
  const content = generateIcsContent(courses);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
