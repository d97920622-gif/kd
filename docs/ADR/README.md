// path: docs/ADR/README.md

# Architecture decision records

Seven records decide how step 1 is built. Each one states the context it was
made in, the decision, what it costs, what was rejected and how the decision is
checked today, because a decision whose verification is not written down is a
decision that quietly stops being true.

| Record | Title                                                                                                  | Status   | Step                          |
| ------ | ------------------------------------------------------------------------------------------------------ | -------- | ----------------------------- |
| 0001   | [Stack and toolchain baseline](ADR-0001-stack-and-toolchain-baseline.md)                               | Accepted | 1 (sub-steps 1.1-1.3)         |
| 0002   | [English only, with one documented exemption](ADR-0002-english-only-exception.md)                      | Accepted | 1 (sub-step 1.5)              |
| 0003   | [Presentation is data: the string catalogue and the design tokens](ADR-0003-presentation-is-data.md)   | Accepted | 1 (sub-steps 1.3, 1.12, 1.13) |
| 0004   | [The environment contract and the server-only boundary](ADR-0004-environment-contract.md)              | Accepted | 1 (sub-steps 1.4, 1.30)       |
| 0005   | [Route-group taxonomy and the async boundaries](ADR-0005-route-group-taxonomy-and-async-boundaries.md) | Accepted | 1 (sub-steps 1.19-1.23, 1.30) |
| 0006   | [Web hardening baseline](ADR-0006-web-hardening-baseline.md)                                           | Accepted | 1 (sub-step 1.26)             |
| 0007   | [Segments, gates and the verification floor](ADR-0007-segments-gates-and-the-verification-floor.md)    | Accepted | 1 (the build model)           |

## When a record is written

A record is written when a decision is architectural - it constrains later work,
it is expensive to reverse, and a reader six months from now would ask why. It is
not written for a naming choice inside one file, or for anything the plan already
settles: the plan is the specification, and a record that repeats it adds a file
to maintain and no information.

The build writes a record in the sub-step that makes the decision, or at the end
of the segment when several sub-steps made one decision between them. Step 1
collected its decisions in sub-step 1.32; that is a one-time batch, not the
pattern.

## What every record carries

- A path comment on line 1, then `# ADR-NNNN -- <title>`.
- A metadata block: status, date, the step and sub-steps that decided it, and the
  records it supersedes or is superseded by.
- `## Context` - the facts that forced a choice, including the constraints of the
  environment the build runs in.
- `## Decision` - what was decided, in the present tense, in enough detail that a
  reader can act on it without reading the code.
- `## Consequences` - what it costs and what it enables, stated honestly,
  including the parts that are inconvenient.
- `## Alternatives considered` - the options that lost, each with the reason it
  lost. A record with no alternatives is a record that was not a decision.
- `## Verification` - how the decision is checked today: the check script, the
  probe, the evidence file or the gate that would fail if the record stopped
  being true.

## Status values

`Proposed` (written, not yet agreed), `Accepted` (in force), `Superseded`
(replaced by a later record) and `Deprecated` (no longer applicable, not
replaced). A record is never edited to say something else: it is superseded by a
new one, and both stay, because the reason a decision changed is worth reading.

## How the set is kept honest

`npm run check:governance` verifies the set as a whole: that ADR-0001 to ADR-0007
each exist under `docs/ADR/`, that every record carries the metadata block, the
five sections and a reference to at least one check script, that a record which
says it is superseded by another agrees with that record's own metadata, and that
this index names every record. The records themselves are not the gate's
business: what they say is reviewed by the owner, and what they promise is
checked by the command they name.
