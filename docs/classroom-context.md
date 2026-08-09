# Safe classroom context

Classroom context stores reusable, general teaching conditions: typical class
size, medium of instruction, available resources, broad instructional supports,
preferred duration, and a short teacher note. It is private to the authenticated
teacher and protected by the same ownership-scoped Row Level Security model as
lesson plans.

Do not store learner names, email addresses, phone numbers, home addresses,
diagnoses, medical needs, identifiable behavior incidents, or other individual
records. The form offers curated learner-support choices and rejects common
identifying or sensitive patterns in teacher notes, but teachers must still
review what they enter.

Saved context is never sent to an AI provider automatically:

- Lesson creation fetches and applies it only after **Apply saved context** is
  selected. The populated lesson fields remain reviewable, and the context can
  be excluded before generation.
- Editor AI actions require a separate checkbox. The server uses context only
  for relevant objective, procedure, and assessment actions; unrelated actions
  receive none.
- The context is validated, serialized as bounded JSON data, and clearly marked
  as untrusted. Content inside it cannot change system instructions.

Classroom context describes instructional conditions, not an official learner
support plan, health record, or substitute for the school's protected student
information systems.
