# Product thinking

FlytBase Account Intelligence is for a sales manager who needs to decide what an account is worth, who can move it, what to do next, what could derail it, and what is still unknown. It is intentionally a decision surface rather than a conventional contact database.

Its decisions are deterministic and inspectable. A critical source-recorded deadline or unresolved blocker comes before a ready, evidenced next move. Verified financial evidence comes before a deal whose value must be substantiated. Where neither is known, the recommended action is precise evidence collection, not a generic “follow up.” The dashboard labels source-confirmed dates separately from recommendations.

Evidence is the product boundary. Records retain their original source identifiers. A fact is classified as verified, told, claim, or unknown according to its supplied status. An identified opportunity is excluded from supported revenue; a value without verified support is rendered “Not substantiated.” Missing decision roles, approvals, and financial support create visible evidence gaps. Absence is never interpreted as safety.

The current MVP cannot infer undocumented API schema perfectly, resolve a person’s authority beyond source evidence, or run a continuous background synchronizer. It uses safe generic field discovery and persists raw payloads so mappings can be strengthened after observing production responses. The dashboard waits for the upstream 65-second shared rate limit and serves cached data between eligible syncs.

AI assisted development accelerated the implementation, including UI composition, defensive parsing, and rule articulation. The runtime itself uses no LLM and does not manufacture account facts.
