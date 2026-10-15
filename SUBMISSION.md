# Submission

**Candidate name:** _Your name_
**Date:** _Date_
**Time spent:** _Approximate hours_

---

## Completed Tasks

Check off what you finished:

- [x] Task 1 — Create Product
- [x] Task 2 — Update Variant
- [x] Task 3 — Fix soft-delete bug
- [ ] Task 4 — Loading & error states
- [ ] Task 5 — Input validation

---

## Approach & Decisions

_Briefly describe the approach you took for each task. Mention any trade-offs you made or alternative approaches you considered._

### Task 1

I first reviewed the existing routes, database schema, API helpers, and frontend components so that the implementation would follow the project's existing conventions.

On the backend, I added request validation directly to the rpdocut route. I considered extracting this into a separate validatioin module, but kept it local since there's only one product-creation endpoint. If the API were to grow, I would move the validation and request types into a resuable validation boundary. I also made the variant name for each SKU to be required because the database schema defines it as NOT NULL.

The product and its variants are inserted inside a transaction, so that the operation is all-or-nothing. If anything fails to insert, the previously inserted product and variants will roll back. For returning to the frontend, I used the inserted product ID to retrieve the completed product and its variants.

On the frontend, I followed the existing card, typography, spacing, button, and responsive layout patterns. The form supports adding and removing variants while ensuring there must be at least one variant added. It also does client-side input validation, with any errors being displayed on the form.

### Task 2

I reviewed the existing product update route and followed the same general structure for variant updates. The backend checks first checks that the variant exists, then validates any price or inventory values if they are included in the request (since they're optional). 

For the frontend, I chose a dialog box rather than directing to a separate page because the edit is small. I put the dialog into its own component to keep `ProductDetailPage` focused on displaying the product and coordinating page-level state.

The dialog box pre-populates the current values and performs client-side validation. Although the backend does support updating the SKU and variant name, I kept these values read-only in the dialog box since the task only requires editing price and inventory count of a variant. After a successful update, the product page replaces the updated variant in local state rather than refetching the entire product.

### Task 3

I looked at the backend route that retrieves all products, since it should be the backend's reposibility to filter out soft-deleted products. In the route, I modified the database query to exclude products with a non-null `deleted_at` column by adding it to the initial `conditions` array.

### Task 4

### Task 5

---

## What I'd improve with more time

_What would you add, refactor, or fix if you had another couple of hours?_

Improve backend request validation by extracting it from the route handlers into reusable functions that return normalised input. Additional checks could handle problems like malformed request bodies, invalid route IDs, and unsupported category/status values in the product creation page.

---

## Anything else?

_Optional — anything you want the reviewer to know (e.g. bugs you noticed, improvements you'd suggest to the existing code, etc.)._
