---
paths:
  - "src/features/product/**"
  - "src/features/order/order-product.entity.ts"
  - "src/features/order-shipping/**"
---

# Product Model Protocol

**Scope:** How `product`, `product_variant` and `product_option` divide the catalog between them,
and which of the three a new piece of information belongs to.

This is the one place in the schema where the table layout encodes domain rules that the columns
alone do not reveal. Read it before adding a column to any `product*` entity — the answer is
usually "a different table than the obvious one".

## 1. The three layers

| Layer | Table | Answers |
|---|---|---|
| Catalog entry | `product` | What is this, in the menu or the listing? |
| Purchasable unit | `product_variant` | What exactly goes in the basket, at what price? |
| Adjustment | `product_option` | How is that unit modified at order time? |
| Composition | `product_bundle_item` | Which *other* products make this one up? |

**A variant is a different thing to sell. An option modifies the thing being sold.**

The test: *can you sell it on its own, and does it have its own price row?* A 32 cm Margherita is a
thing — own SKU, own price, own food cost. "Stuffed crust" is not a thing; it is +8 RON on whatever
it was attached to.

Two consequences follow:

- Variants are **mutually exclusive and exactly one** — every order line cites exactly one
  `variant_id`.
- Options are **optional, stackable and many** — a line may carry zero, or five.

Getting this backwards has a concrete cost. Colour as an *option* means one SKU for every colour, so
you can never know how many black ones are left. Gift wrap as a *variant* doubles the SKU count for
something that is not a product.

## 2. Variants

- **Every product carries at least one variant, even when nothing varies.** A single-variant product
  is the normal case, not a special one. The service layer creates the default variant alongside the
  product. The alternative — prices on both the product and the variant — means two places to look
  and a precedence rule to remember.
- `product_price` is keyed on `variant_id`, never on `product_id`. So is stock: `grn_item` and
  `warehouse_movement` both point at the variant, because the variant is the thing that runs out.
- **Price is per market, cost is not.** `product_price` holds `sale_price`, `reference_price` and
  `min_price` per currency, since those are quoted rather than converted. `reference_price` (the
  column once called `rrp`) is display only — no pricing path reads it, and nothing checks it
  against `sale_price` but the dashboard's own warning. `product_variant.cost_price` is a single
  base-currency figure — the books are kept in one currency, a foreign purchase is converted once
  at the receiving day's rate and frozen, and margin settles in base on both sides via
  `order_product.exchange_rate`. Converting cost at read time would make last month's margin move
  with today's rate.
- **Cost never influences the sale price.** `min_price` is the only floor a discount is clamped to
  (`discount-resolution.service.ts` → `resolveFloor`); `cost_price` feeds reporting and nothing
  else. Absent a `min_price`, a stacked discount is bounded only by zero — which is why the
  product form warns on a price row that has none. A seller who wants cost respected states it as
  a `min_price` in that market's currency.
- **`track_stock` decides whether stock applies at all**, per variant. False for a restaurant dish,
  true for a shirt on a shelf. It cannot be derived from `product.type` — a dish and a
  print-on-demand shirt are both `physical` and neither is stocked. `low_stock_threshold` and
  `allow_backorder` sit beside it.
- **The SKU is the variant's, and only the variant's.** `product` carries no code of its own: for a
  single-variant product — the normal case — a style code above it said the same thing twice, and
  nothing downstream ever read it (no order line, goods receipt, invoice or report). `barcode` sits
  beside it for the same reason a SKU does: both identify one sellable unit, so two sizes carry two
  different EANs. A product is identified to a person by its translation's `label`, and addressed in
  a URL by that translation's `slug`; a code lookup in the catalog search matches variant SKUs.
- What distinguishes the siblings lives in `product_variant_attribute`, so the axes are whatever the
  catalog needs rather than a fixed size/colour pair.
- Its unique key stops at the label (`variant_id`, `attribute_label_id`), so a variant holds exactly
  one value per axis. Contrast `product_attribute`, whose key includes the value: a product may list
  three allergens under one label, a variant cannot be both `large` and `small`.
- At most one `is_default` per product, held by a partial unique index. A row-level `@Check` cannot
  see the set of rows it needs to count.

## 3. Options

An **option group** is a question asked at order time; the **options** are its answers; a
**`product_option_price`** row carries what each answer does to the price, per currency.

Cardinality is expressed *only* as `min_select` / `max_select`. There is no `is_required` flag and
no single/multiple enum, because either would have to agree with the bounds forever, and that is the
pair nobody notices drifting.

| min | max | Shape |
|---|---|---|
| 1 | 1 | Required, radio buttons — *crust, steak doneness* |
| 0 | 1 | Optional single — *add a side* |
| 0 | `null` | Optional, unlimited — *extras* |
| 2 | 2 | Exactly two — *"choose 2 sides"* |
| 1 | `null` | At least one — *"pick your toppings"* |

Deltas are **per currency**, like `product_price`. A delta carries a currency whether or not a column
says so: adding 3 to a price quoted in EUR is only correct if the 3 is EUR. One figure for every
market is silently wrong in the line total, which is the one place an error compounds.

Deltas are **signed**. A "Side" group on a combo can offer *No side, −5.00* — the customer declines
the fries and the price drops. That is an option, not a discount: it describes what was ordered, not
a promotion.

Labels on both groups and options are `term` rows, so the Romanian menu renders from the same
records as the English one.

### 3.1. Where the pieces live

The three tables are written as **one aggregate** by `ProductOptionRepository.syncGroups`, reached
from `ProductService` whenever a payload carries `option_groups`. A group is the question and its
options are what it means, so neither is saved without the other.

**The label term is the natural key at every level**: `syncGroups` keys a product's groups by
`label_id`, `syncOptions` keys a group's answers by `label_id`, and `syncPrices` keys the deltas by
`currency`. Nothing in the schema forbids a product asking the same question twice, but a payload
that did could not be told apart from an edit of the first — it collapses into one row and the
duplicate silently disappears. The editor is what refuses the repeat, per level
(`ProductValidator.manage`'s `superRefine` in `../nready-ui/.../product.definition.ts`), because a
form showing "Crust" twice is a defect either way.

`attachBranches` **joins the wording on both levels** and orders the answers by `position` — the
same rule §12.8 states for attribute definitions, for the same reason: the rows carry ids and
nothing else to name themselves by, and insertion order matches `position` only until a group is
reordered. The deltas are ordered by `currency`, which is all they have.

The editor is `FormOptionsProduct` (`../nready-ui/src/app/(dashboard)/dashboard/product/`), on the
product form's own Options tab. It seeds no group: most products ask nothing, so an empty list is
the meaningful default — the opposite of the variants editor, where one row is required. Cardinality
is restated in words beside the two numbers, since they are its only expression.

## 4. Worked example — Pizza Margherita

**Product** *Pizza Margherita*, `unit = piece`, `vat_category = reduced`, no brand. It carries no
code of its own — the codes below are its variants'.

**Variants** — size is the axis, so it is a variant: different price, different dough cost.

| Variant | sku | is_default | price (RON) |
|---|---|---|---|
| Ø 25 cm | `PIZZA-MARG-25` | yes | 32.00 |
| Ø 32 cm | `PIZZA-MARG-32` | no | 45.00 |

Each links to `product_variant_attribute`: label term *Size*, values *25 cm* / *32 cm*.

**Option groups** — three questions asked at order time:

| Group | min | max | Meaning |
|---|---|---|---|
| Crust | 1 | 1 | Exactly one |
| Extra toppings | 0 | 4 | Optional, up to four |
| Side | 0 | 1 | Optional, at most one |

**Options** and their deltas:

| Group | Option | is_default | price_delta (RON) |
|---|---|---|---|
| Crust | Classic | yes | 0.00 |
| Crust | Thin | no | 0.00 |
| Crust | Stuffed | no | +8.00 |
| Extra toppings | Extra mozzarella | no | +6.00 |
| Extra toppings | Prosciutto | no | +9.00 |
| Extra toppings | Truffle oil | no | +12.00 |
| Side | Fries | no | +9.00 |
| Side | Salad | no | +11.00 |

## 5. How an order line resolves

Customer orders **one 32 cm Margherita, stuffed crust, extra mozzarella and prosciutto**. The
`order_product` row holds:

- `variant_id` → `PIZZA-MARG-32`, `product_id` → `PIZZA-MARG`
- `quantity` = 1
- **`price` = 45.00** — the variant price *alone*
- `vat_rate` = 11.00, `currency` = RON
- `options` = `[ {Stuffed crust, +8.00, RON}, {Extra mozzarella, +6.00, RON}, {Prosciutto, +9.00, RON} ]`

```
 45.00  variant price
 +8.00  stuffed crust
 +6.00  extra mozzarella
 +9.00  prosciutto
──────
 68.00  × quantity 1  = 68.00 net
                        75.48 gross (11% VAT)
```

**`price` is not the line total and is not meant to be** — the deltas are what reconcile it. Any code
that treats `price * quantity` as the line total is wrong the moment an option is chosen.

`options` is a snapshot, frozen for the same reason `DiscountSnapshot` is: raise stuffed crust to 10
RON next week and last month's receipt still reads 8.

`product_id` is stored next to `variant_id` on purpose, denormalized — every revenue report groups by
product, and the line has to keep saying what it was.

## 6. Retail, same machinery

- **T-shirt** — variants are size × colour (`S/black`, `S/white`, `M/black`…), each with its own SKU
  and, once stock exists, its own count. Options are *Gift wrap +15* (0–1) and *Custom back print
  +40* (0–1).
- **Laptop** — variants are the RAM/storage configurations. Options are *3-year warranty +499* and
  *Engraving +99*.

## 7. What belongs where

| Information | Home | Why not options |
|---|---|---|
| Allergens, calories, ingredients | `product_attribute` | Descriptive, not selectable, no price effect |
| "No onions, extra napkins" | `order_product.notes` | Free text, unbounded, no price effect |
| Happy hour, coupons, loyalty | `discount` + `product_discount` | Conditional on customer or date, applied *on top of* the resolved price |
| Size, colour, capacity | `product_variant_attribute` | Own SKU, own price, own stock |

Which labels a product is *expected* to fill in, and what counts as an admissible value, is declared
per category — see §12.

## 8. Bundles

`product.composition` is `simple` or `bundle`. It is deliberately **not** a value on `type`:
`physical / digital / service` describes fulfilment and stays orthogonal, so a bundle of physical
goods is both `physical` and `bundle`.

A bundle is a product like any other — its own content, categories, availability and headline price
on its default variant. What it adds is components.

### 8.1. Structure, and how it mirrors options

A bundle is a **flat list** of `product_bundle_item` rows, every one of them always included:
`product_id` names the bundle, `variant_id` names what is consumed, `quantity` how much of it.

| Bundle | Option equivalent | Difference |
|---|---|---|
| `product_bundle_item` | `product_option` | The answer is a **variant**, not a `term` |
| — | `product_option_group` | A bundle asks no question, so it has no groups |
| — | `product_option_price` | A component carries no delta; the bundle price is the price |

The first difference is the whole reason components and options are separate tables rather than one
with a nullable column: an option's answer is a label with a delta and nothing behind it, while a
component is a real sellable thing that consumes stock, carries its own VAT class and can be
refunded on its own. The behaviour at checkout diverges completely.

The other two are a deliberate omission. **A bundle is not customizable**: there is no "choose a
side", no preselected candidate, no per-component price adjustment. `product_option_group` already
expresses "ask a question and adjust the price" for any product, bundle included, so what is absent
is specifically an answer that is itself *another product*.

The intended route to customization, when it is wanted, is **optional components** — a component
flagged as swappable for a named alternative, priced as the difference between the two. It is not
built, and nothing here should be shaped to anticipate it.

A bundle must add up to **at least two units** — `SUM(quantity)` over its components — or it is a
product wearing a bundle's clothes. Counted in units rather than components, so a two-pack (one
component, `quantity: 2`) qualifies. `ProductService.assertBundleIsComposed` enforces it on write,
reading the rows back after the sync because an update is partial and a payload that omits
`bundle_items` leaves the existing ones in place.

### 8.2. Worked example — "Burger Menu"

Bundle price **55.00 RON**.

| item | quantity |
|---|---|
| Cheeseburger | 1 |
| Fries | 1 |
| Cola 0.5 | 1 |

The customer pays 55.00 for the three. A menu with a beer instead of the cola is a **different
bundle product**, at its own price — not a variation of this one.

A **fixed kit** (gift set) is the same table with more rows.

### 8.3. Why the order line explodes

A bundle's 55.00 covers food at 11% and a drink at 21%. A single `order_product.vat_rate` cannot
represent that, and getting it wrong is a tax error rather than a display bug. So a bundle becomes
**one header line plus one child line per component**, linked by `order_product.parent_id`:

- **Header** — the bundle variant, quantity, `price = 0`.
- **Children** — each component's apportioned share of the bundle price, at its *own* `vat_rate`.

Apportionment is pro-rata by the components' **standalone** prices. With standalone prices of
38 / 18 / 14 (total 70) against a charged 55.00:

| Component | Share | Apportioned | Rate | VAT |
|---|---|---|---|---|
| Cheeseburger | 38/70 | 29.86 | 11% | 3.28 |
| Fries | 18/70 | 14.14 | 11% | 1.56 |
| Cola 0.5 | 14/70 | 11.00 | 21% | 2.31 |
| | | **55.00** | | **7.15** |

Gross 62.15.

The header carries zero money so that `SUM(price)` over an order stays correct with no
special-casing. Exploding also makes stock deplete on the right variants and lets a single
component be refunded.

⚠️ **Rounding must reconcile.** Pro-rata drifts a cent; the service assigns the remainder to the
largest share so the parts sum to the charged total exactly.

### 8.4. Excluded on purpose

- **Multi-buy** ("3 for 2", "6-pack") is a promotion, not a composition — use `discount`.
- **Customer-chosen components** — see §8.1. Options cover "ask a question"; a swappable component
  is the planned shape, and is not built.
- **Nested bundles** are forbidden. A bundle item pointing at another bundle's variant creates a
  cycle no constraint can detect; the service must reject it.
- **Bundle-level stock** does not exist. Availability is the `min` over the components, and a
  bundle's own variants carry `track_stock = false`. That flag is also what keeps the bundle header
  out of shipment allocation (§10, invariant 9) — nothing was ever received against the bundle's
  variant, so there are no lots to pick from.
- **`vat_category` on a bundle product** is unused — the components carry their own.

## 9. Availability — two different questions

Do not merge these; they answer different things and only one drives status.

- **`product.available_from` / `available_until` / `discontinued_at`** — absolute, describe the
  product's life in the catalog: when it first appears and when it is withdrawn. These alone drive
  `sale_status`, which a cron recomputes (see the entity's own JSDoc).
- **`product_availability`** — recurring windows *within* that life: a lunch menu on weekdays
  12:00–15:00, a happy hour every evening. Leaves `sale_status` untouched — an out-of-hours product
  is still `available`, just not right now. **No row at all means unrestricted**, so the common case
  costs nothing.

**Weekdays are ISO 8601 everywhere — 1 = Monday through 7 = Sunday.** `day_of_week` and
`discount.conditions.day_range` are the only two places a weekday is stored, and they use the same
numbering so a day means one thing across the codebase. It is *not* what `Date.getDay()` returns:
`isoWeekday` in `helpers/date.helper` is the conversion, and adding a second one anywhere is how the
two drift back apart. `starts_at` / `ends_at` are `time`, read in the venue's timezone.

**One interval per day, per product.** A partial unique index on
`(product_id, day_of_week) NULLS NOT DISTINCT WHERE deleted_at IS NULL` holds the same-day half —
`NULLS NOT DISTINCT` is what also stops a second *every-day* interval, which the default would
treat as distinct. The other half, that an every-day interval excludes an interval on a specific
day, compares rows holding different values and so no index reaches it: `ProductValidator` carries
that one. Both are also mirrored client-side, and each message lands on the offending row's own
`day_of_week`.

An interval is a weekday and, optionally, a span of clock times — **null in both columns together
means all day**, and a check constraint refuses one set with the other null because half a window
has no agreed reading. Bounding the recurrence itself
— a terrace list that runs daily but only over the summer — is the product's own life in the
catalog, so it goes on the absolute dates above, where it reaches `sale_status`. Expressing it a
second time on the window would put the same fact in two places with only one of them deciding
whether the product is listed.

## 10. Invariants the database cannot hold

These need the service layer. None of them can be pushed into a constraint.

1. **Every product has at least one variant**, and exactly one is `is_default`. The partial unique
   index enforces *at most* one; nothing enforces *at least* one.
2. **A chosen option must belong to a group of the product being ordered.** Nothing stops a line
   citing a pizza crust on a bottle of wine — `options` is jsonb, and even a join table could not
   express the cross-table check.
3. **`min_select` / `max_select` compliance at checkout.** The bounds are stored; only the service
   can count what was submitted.
4. **The line total.** `price` plus the sum of the option deltas, then quantity, then discounts,
   then VAT — in that order, since discounts apply to prices excluding VAT.
5. **A bundle adds up to at least two units.** `SUM(product_bundle_item.quantity)` over the bundle
   has to reach two once `composition = bundle`; a check constraint sees one row at a time.
6. **No nested bundles**, and no bundle that contains one of its own variants.
7. **Bundle apportionment reconciles to the charged total**, remainder to the largest share (§8.3).
8. **Shipment allocation must not exceed what was ordered.** The sum of
   `order_shipping_product.quantity` across every shipment of one `order_product` has to stay
   within that line's `quantity`. Nothing stops shipping 15 of an ordered 14 — and with stock
   tracking on, the surplus consumes real lots.
9. **A bundle is shipped by its children, never its header.** `order_shipping_product` points at
   `order_product`, and for a bundle the header line carries no variant worth picking — the
   component lines hold the real, stockable variants. Allocating the header would leave the stock
   movement with nothing to consume.

10. **A list-backed attribute definition has at least one option**, and a recorded `value_term_id`
    is one of them. `value_type = 'term'` implies rows in `product_category_attribute_option`, which
    a row-level check cannot count; the admissible-value check spans three tables (§12).
11. **`value_base` agrees with `value_numeric` and the definition's `unit`.** The check ties the two
    columns' nullability together, but nothing verifies the arithmetic — only the service applying
    `toBaseUnit` on every write does. Changing a definition's `unit` therefore has to rewrite every
    value already recorded under it, or the stored base figures describe a quantity the form no
    longer shows.

`order_product.variant_id` and `product_id` used to belong on this list. They no longer do: the
`variant` relation is a composite foreign key over both columns against
`product_variant (id, product_id)`, so the database rejects the mismatch.

## 11. Stock lives elsewhere

`warehouse` and `grn` are their own features and own every stock table — `warehouse`, `grn`,
`grn_item`, `warehouse_movement`. Nothing about quantity belongs in `product`; the catalog's only
part in it is `product_variant.track_stock` (§2).

The entities exist; none of the behaviour does. FIFO allocation, the weighted-average cost
recompute on receipt, cancellation reversals and reconciliation are all still unwritten, and the
full design is in the README TODO. Two things settled here because they touch the catalog:

- **Stock leaves on shipment, not on order confirmation.** `order_shipping` carries the
  `warehouse_id`, so one order can ship from two warehouses, and a lot cannot be picked before the
  warehouse holding it is known. The movement's source is an `order_shipping_product`;
  `order_product` carries no lot reference at all, because one line routinely spans several lots.
- **A damaged return must not go back into its lot.** A customer return normally re-enters the lot
  it was picked from, at the cost it left with — the movement records its source, so the lot is
  known. Damaged goods are the exception: returning them to stock means they get picked and sold
  again. They belong in a write-off, or in a quarantine location. Nothing detects this
  automatically; the return has to ask.

## 12. Category-declared attributes

`product_category_attribute` declares what a product in a category is expected to say about itself.
It holds no product data — it is the schema the product form renders from and the validator checks
against.

### 12.1. The value stops being text

The point of the table is that `500 ml` stops being one string. The number goes in
`product_attribute.value_numeric` as a bare `500`; `ml` is the definition's `unit` and is applied at
render. Only that split makes *"drinks between 300 and 600 ml"* answerable — a value living in
`term_content` would have to be cast out of localized text, per language, with no index in reach.

Four value columns, exactly one filled, enforced by a `@Check`:

| Definition `value_type` | Column |
|---|---|
| `term` | `value_term_id` |
| `number` | `value_numeric` (+ `value_base`) |
| `string` | `value_text` |
| `boolean` | `value_boolean` |

`term` is the default and the one to reach for whenever the value is a word. A term-backed value is
a row other products point at too, so renaming *Gluten* corrects every product at once and both
language catalogs read the same record. `string` is for a literal owned by a single product — a
model code, a batch reference — where sharing would mean nothing.

### 12.2. Units convert on write

A label may legitimately be quoted differently in different categories — *Volume* in `ml` under
Drinks, in `l` under Bulk. `value_base` is what makes a range spanning both correct: every unit in
`MeasureUnitEnum` (`src/shared/types/measure-unit.type.ts`) declares a `dimension` and a `factor`
into that dimension's base, and `toBaseUnit` applies it as the row is written. 0.5 l and 500 ml both
land on 500.

- **Filters compare `value_base`; display uses `value_numeric` + the unit's symbol.** The facet
  index is on `value_base` for that reason.
- **A unitless number gets a `value_base` too**, equal to `value_numeric`. Every numeric attribute
  has one, so the filter needs no branch and there is one indexed column rather than two.
- **Converting at read time would cost the index scan** — arithmetic between the filter and the
  index. It happens once, on write.
- **`value_base` is wider than its source** (`numeric(20,6)` against `numeric(14,4)`): converting
  upward multiplies, and 5 t is 5,000,000 g.
- **Only ratio scales convert.** Temperature is absent on purpose — °C to K is affine, so a factor
  cannot express it.
- **Changing a definition's `unit` does not reinterpret existing values.** Every row under it has to
  be rewritten through the same conversion, or the stored base figures describe a quantity the form
  no longer shows (§10.11).

`suffix` survives alongside `unit` for decoration a measure does not cover — `pcs`, `%`. A `@Check`
forbids both at once, since they would give two answers to what follows the number.

### 12.3. `scope` — which table the value lands in

`product` writes to `product_attribute`, `variant` to `product_variant_attribute`. The distinction
is §7's, and the form cannot place a value without it: *Colour* asked once for the product and
*Colour* asked once per variant are different products.

### 12.4. `value_type` and `type` are orthogonal

`value_type` is storage, `type` is capture — *330* is a number whether typed or picked from a list.
The admissible `type` → `value_type` pairings are held by a `@Check` on `product-category-attribute.entity.ts` — read it there rather than restating it.

Options live in **`product_category_attribute_option`** — one row per admissible value, pointing at
an `attribute_value` term, ordered by `sort_order`. A table rather than a `jsonb` array of strings,
because the term buys three things a literal cannot: wording renders per language from
`term_content`, two categories offering the same list point at the same records, and a rename
corrects every product already carrying the value. The product stores that same `term_id` in
`value_term_id`, so the option list and the recorded value are one vocabulary rather than two
spellings that have to agree.

That the list is non-empty, and that a recorded value is on it, are **service-layer invariants**
(§10.10) — a row-level check cannot count rows in another table.

**A numeric attribute has no options.** Its restriction is `min_value` / `max_value`, which is what
bounds a measurement and leaves the number in `value_numeric` where it stays filterable. A dropdown
of allowed numbers would put the value back in a `term` and forfeit range filtering entirely; if a
catalog genuinely needs one, that trade is the thing to weigh.

### 12.5. Uniqueness says two different things

`product_attribute` carries two partial unique indexes rather than one, because the rule genuinely
differs by shape and a nullable column inside a single key would enforce neither — Postgres counts
every NULL as distinct.

- Term-backed rows are unique on `(product_id, attribute_label_id, value_term_id)`, so a product may
  list three allergens under one label.
- Scalar rows are unique on `(product_id, attribute_label_id)`, so a label admits exactly one
  number, string or boolean. A product has one volume.

A multi-pick `checkbox` over terms is therefore **one row per choice**, not one row holding a
joined string: the partial unique index is what admits them, each stays a `value_term_id` the
facet index can answer on, and renaming the term corrects every product carrying it. That is what
`FormAttributesProduct` renders it as.

### 12.6. Resolving the form for a product

A product sits in *several* categories (`product_category` is many-to-many), so the definition set
is a union, not a lookup:

1. The product's `category_id`s.
2. Expand to ancestors through the closure table, keeping rows with `inherit = true`; a category's
   own definitions apply regardless.
3. Dedupe by `attribute_label_id`, **deepest category wins** — a child overrides an ancestor's
   `type` / `suffix` / `options` rather than adding to it.
4. Split by `scope`.
5. Order by `sort_order`, then label.

### 12.7. Filtering

Two partial covering indexes per attribute table, one for each filterable shape. Both lead on the
label, because a filter always names one, and both carry the owning id so the scan answers from the
index alone. The pre-existing `IDX_product_attribute_attribute_value_id` cannot serve either — it
leads on the value — and stays only for the cascade `term` triggers on delete.

Combine facets with **one indexed subquery per facet, `INTERSECT`ed**. A single `OR`-of-`AND`s
cannot use a composite index leading on the label and degrades to a sequential scan:

```sql
SELECT product_id FROM product_attribute
 WHERE attribute_label_id = :volume AND value_numeric BETWEEN 300 AND 600
   AND deleted_at IS NULL
INTERSECT
SELECT product_id FROM product_attribute
 WHERE attribute_label_id = :colour AND value_term_id = ANY(:colours)
   AND deleted_at IS NULL;
```

`is_filterable` governs which facets the storefront offers. The indexes cover every row regardless,
so it is a product decision, not a performance one.

`is_required` is enforced in `ProductService.assertRequiredSupplied`, called once for the product
scope and once per variant. It cannot live with the per-value checks: those only see the values a
payload carries, and a required attribute the caller omitted has no row for them to look at. The
product form mirrors it, so an empty required field fails before the request.

### 12.8. Where the pieces live

The backend is complete: migration `1786920000000-product-category-attribute.ts`, plus repository,
service, validator, policy, routes, controller and docs. `/product-category-attributes` carries the
usual create / read / update / delete / restore / find, and one route of its own:

`GET /product-category-attributes/resolve` is §12.6's walk over HTTP. It takes the `category_id`s
the form is being drawn for rather than a product id, because a product being created has no id
yet. It is declared **ahead of `/:id`** in the routes module, or Express matches the literal
against the id parameter and the param validator rejects it before the handler is reached.

Tests cover the resolution walk (`product-category-attribute-service.test.ts`) and the §12.4
capture/storage matrix (`product-category-attribute-validator.test.ts`, which repeats the entity's
`@Check` as a table).

The definitions themselves are edited from the category that declares them, not from a page of
their own: `ManagerAttributesCategory` (`../nready-ui/src/app/(dashboard)/dashboard/category/`) is
the `attributes` row action on a **product** category, and it opens the standard form windows of
the `product-category-attribute` data source.

**Every read that draws a control joins the wording**, because the rows carry ids and nothing else
to name them by: `find` brings the label, `read` brings the label and each option's term, and
`findForCategories` — behind `resolve` — brings both, since that set *is* the form a product
renders.

The product side is closed too. `FormAttributesProduct`
(`../nready-ui/src/app/(dashboard)/dashboard/product/`) draws one field per definition, keyed on
the `type` / `value_type` pairing (§12.4), and every editor that writes a product renders it:
the product form on its own Attributes tab for the `product` scope and inside each row of the
variants editor for the `variant` scope, and the bundle form on both — a bundle carries one
sellable line, so it answers the `variant` scope once rather than per row. That is not cosmetic:
`assertRequiredSupplied` runs per variant, so a required axis would otherwise leave a bundle in
that category unsavable with no field to satisfy it. The form calls `resolve` for the categories currently picked and reconciles its
answers against the result on every change — one entry per definition, empties included so a
required one has something to fail on, and nothing for a label the categories no longer declare,
which the backend would refuse.

## 13. Deferred, with the decision already made

- **Named menus** — `product_availability` says *when*, but nothing groups windows into a
  customer-facing "lunch menu", and two products sharing a schedule repeat it row for row.
- **Order-level currency and totals.** `order_product` and `order_shipping` each carry their own
  `currency` and `exchange_rate`, and nothing asserts they agree — an order with a RON line and a
  EUR line is representable today. `invoice` has `base_currency`; `order` has nothing equivalent.
  A stored order total is worth considering at the same time, since the bundle work made a line
  total non-trivial (`price`, plus option deltas, plus children) and every listing recomputes it.
- **Recipes / bill of materials** — a prepared item consumes ingredients, so depleting stock needs a
  `product_component` layer. Ingredients would be variants with `track_stock = true` that the dish
  consumes; the dish itself stays untracked. Only worth building once the `grn` behaviour exists.
- **Full-text search** — `ProductQuery.filterByTerm` will ILIKE across `product_content.label` and
  `description`, which no btree can serve. The GIN expression index belongs in a hand-written
  migration and **must not** be added to the entity; see `1786415990000-search-indexes.ts`.
