# booking-app

Meeting-room booking rules behind the office booking screen.

- A schedule is a list of `{ room, start, end, who }` for a single day.
- Times are `"HH:MM"` strings; the leading zero is optional, so `"9:00"` is valid.
- A booking runs from `start` up to `end`, so 14:00–16:00 is two hours.

Run the tests with `npm test`.

## Ideas for later
- Recurring bookings
- Email reminders
