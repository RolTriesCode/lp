STEP:
05 — Dashboard Create Lesson Form

REASONING:
HIGH

OBJECTIVE:
Build the dashboard’s primary lesson intake form with reusable validation and reference-matched controls.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Dashboard lesson form components, `lib/lesson-plan-schema.ts` or shared schema directory, reusable option data, dashboard styles

IMPLEMENTATION:
- Inspect current components and keep the form inside the reference lesson-creation card.
- Use React Hook Form with a Zod schema and typed defaults.
- Support curriculum, lesson type, grade, subject, quarter, topic, duration, optional competency, and additional teacher instructions. Keep secondary fields in a compact progressive disclosure area when the reference does not provide permanent space.
- Provide MATATAG and ILAW options; Detailed and Semi-Detailed lesson types; reusable grade options; and English, Filipino, Mathematics, Science, Araling Panlipunan, MAPEH, Values Education, and Technology and Livelihood Education subjects without treating the list as immutable.
- Use accessible labels, descriptions where useful, required indicators, inline validation messages, and deterministic control IDs.
- Match form heights, spacing, borders, icon treatment, primary button, and responsive wrapping to the reference.
- Keep the schema reusable by `/lesson/create` and the future generation API.
- For this step, a valid submission may remain a local prototype callback.

DO NOT:
- Call an AI provider, create database records, or add authentication.
- Duplicate the schema inside a component.
- Hide validation state from assistive technology.

ACCEPTANCE CRITERIA:
- All required fields validate through Zod and React Hook Form.
- Invalid submissions show accessible field-level errors.
- Valid values are returned as a strongly typed object.
- The card remains visually faithful and usable by keyboard at desktop and mobile widths.
