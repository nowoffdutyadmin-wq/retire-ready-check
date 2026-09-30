# Calendly Setup — Now Off Duty Founding-Cohort Calls

The public booking URL must match `integrations.calendlyUrl` in
`config/webinar-funnel.json`. Do not publish the offer CTA until that URL has been tested end to
end.

## Event type

Name: "Now Off Duty — 30 Minute Founding-Cohort Call"

Duration: 30 minutes

Location: Video meeting. Configure the approved platform to generate a unique link for each booking.

Buffer after: 15 minutes minimum

Redirect after booking:

`https://nowoffduty.com/call-confirmed`

## Contact details

Use Calendly's standard name and email fields.

Add:

- Phone number

Required: YES

## Price acknowledgment

Add a required checkbox before the fit questions.

Label:

"Before booking, please confirm:"

Checkbox text:

"I understand that the working founding price is $600 and I am genuinely considering whether the
program is right for me."

Required: YES

The `$600` value must match `cohort.price` in `config/webinar-funnel.json` before every publish.

## Fit questions

Add the following questions in this order. These answers are qualification and research data. Do
not turn them into psychological scores or diagnostic result types.

### 1. Current situation

Question:

"Where are you in the retirement transition?"

Type: Single select

Options:

- Within five years of retirement
- Retiring within the next year
- Retired within the last two years
- More than two years into retirement

Required: YES

### 2. Desired outcome

Question:

"What would you most like to have designed or clarified over the next 90 days?"

Type: Single select

Options:

- A more deliberate weekly rhythm
- A clearer sense of contribution
- A better balance between plans and open time
- A way to remain engaged without recreating full-time work
- Something else

Required: YES

### 3. Current friction

Question:

"What has made this part of the transition difficult to design so far?"

Type: Single select

Options:

- Work still occupies most of my attention
- I have ideas but no consistent structure
- My circumstances or schedule keep changing
- I have not known where to begin
- I would prefer to explain in my own words

Required: YES

### 4. Preferred support

Question:

"Which kind of support would be most useful?"

Type: Single select

Options:

- A clear structure to follow
- Guided practice
- Individual feedback
- Group discussion
- Optional accountability

Required: YES

### 5. Open response

Question:

"Is there anything about the chapter you are designing that you would like Chris to understand
before the call?"

Type: Long text

Required: NO

### 6. Schedule availability

Question:

"Can you attend the four live group sessions?"

Type: Single select

Options:

- Yes
- I need the confirmed schedule before I can answer

Required: YES

Update this question with the confirmed live-session schedule before applications open.

## Confirmation page

After booking, redirect to:

`https://nowoffduty.com/call-confirmed`

The page copy is managed in the production application route. Do not duplicate it inside Calendly
beyond the normal booking confirmation.

## Notification emails

Configure these only after the meeting platform and calendar details are confirmed.

Confirmation to booker:

Subject: "Your call is confirmed — [date] at [time]"

Reminder 24 hours before:

Subject: "Your call with Chris tomorrow — [time]"

Reminder 1 hour before:

Subject: "Starting in an hour — your meeting link is inside"

## Pre-launch test

Complete one internal test booking using non-personal test data and verify:

- The public booking URL opens.
- The price acknowledgment shows `$600`.
- Every required question blocks incomplete bookings.
- The calendar invitation contains the correct date, time, timezone, and meeting link.
- Confirmation and reminder emails arrive.
- Rescheduling works.
- The booking redirects to `/call-confirmed`.

Do not submit real prospect data during implementation testing.
