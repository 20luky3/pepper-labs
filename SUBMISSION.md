# Submission

**Candidate name:** _Your name_
**Date:** _Date_
**Time spent:** _Approximate hours_

---

## Completed Tasks

Check off what you finished:

- [ ] Task 1 — Create Product
- [ ] Task 2 — Update Variant
- [ ] Task 3 — Fix soft-delete bug
- [ ] Task 4 — Loading & error states
- [ ] Task 5 — Input validation

---

## Approach & Decisions

_Briefly describe the approach you took for each task. Mention any trade-offs you made or alternative approaches you considered._

### Task 1

I first reviewed the existing routes, database schema, API helpers, and frontend components so that the implementation would follow the project's existing conventions.

On the backend, I added request validation directly to the rpdocut route. I considered extracting this into a separate validatioin module, but kept it local since there's only one product-creation endpoint and the validation rules are. If the API were to grow, I would move the validation and request types into a resuable validation boundary. I also made the variant name for each SKU to be required because the database schema defines it as NOT NULL.

The product and its variants are inserted inside a transaction, so that the operation is all-or-nothing. If anything fails to insert, the previously inserted product and variants will roll back. For returning to the frontend, I used the inserted product ID to retrieve the completed product and its variants.

On the frontend, I followed the existing card, typography, spacing, button, and responsive layout patterns. The form supports adding and removing variants while ensuring there must be at least one variant added. It also does client-side input validation, with any errors being displayed on the form.

### Task 2

### Task 3

### Task 4

### Task 5

---

## What I'd improve with more time

_What would you add, refactor, or fix if you had another couple of hours?_

---

## Anything else?

_Optional — anything you want the reviewer to know (e.g. bugs you noticed, improvements you'd suggest to the existing code, etc.)._
