# Saransh — AI-Powered News Aggregation

Saransh pulls news directly from verified sources and delivers concise, attributed summaries. No opinion, no algorithm, no forwarded videos.

## Language

### Domain Terms

**Story**:
A news event with a headline, summary, sources, and metadata. A Story may span multiple Articles from different sources.
_Avoid_: Article, news item, post

**Article**:
A single source document scraped from a news outlet. Multiple Articles may contribute to one Story.
_Avoid_: Story, news piece

**Source**:
A verified news outlet from which Articles are scraped. Each Source has credibility metadata and scraping configuration.
_Avoid_: Publisher, outlet, feed

**Summary**:
An AI-generated concise version of a Story, attributed to its source Articles.
_Avoid_: Excerpt, blurb, digest

**Citation Link**:
The single canonical Article a Story's Summary was extracted from, stored on the Story as `source_url`. Distinct from the Story's `sources`, which list every outlet that corroborates the event. A Story has at most one Citation Link and may have many Sources. The carousel card's outlet badge links to it.
_Avoid_: Primary source, origin link, reference

**Ingest**:
The act of accepting a structured Story, with its Sources, from an Agent over the API. An ingested Story enters as Published.
_Avoid_: Upload, submit, push, create

**Publication Status**:
Where a Story sits in its lifecycle. Every Story is **Published** — visible to readers — from the moment it is ingested. The **Draft** step was removed on 2026-09-25; review happens before ingest, not after. Because ingest and publication are the same moment, `created_at` is the only time of record — `published_at` was dropped on 2026-10-01.
_Avoid_: State (reserved for geography), stage, visibility

**Waitlist Signup**:
A person who asked to be told when Saransh launches. Identified by email; signing up twice is the same Signup, not two. Carries a Signup Token for anything outside Saransh that needs to refer to it. A Signup is not a User — it is an email we promised to contact, with no credentials and nothing to sign in to. A Signup may later become a User, and the Signup Token is what lets us say they are the same person.
_Avoid_: Subscriber, lead, waitlister

**Signup Token**:
The opaque public identifier of a person Saransh has identified — not the email, and not the row number. Issued at whichever moment identification first happens: joining the Waitlist, or signing in. Stable: a second signup with the same email yields the same Token, and a User whose verified email matches an existing Signup inherits that Signup's Token rather than being issued a new one. A Token therefore outlives the Signup that may have created it, and is how Saransh recognises one person across Visitor, Waitlist Signup and User without the email leaving the system. Named for where it was first issued, not for the only thing it identifies.
_Avoid_: Signup ID, user ID, waitlist ID

**Visitor**:
Someone reading the Saransh site, counted anonymously per browser. A Visitor is not a Waitlist Signup — one Visitor may create several Signups, and one Signup may be made from several Visitors. A Visitor is not a User either: a Visitor is a browser Saransh has not identified, so the moment one signs in they are a User for the rest of that browser's session. Saransh never learns an unidentified Visitor's name or email.
_Avoid_: Session, traffic, audience

**User**:
A person who has signed in and therefore has a durable identity Saransh recognises across browsers and devices. One User is one person across both Saransh and Rajniti — the same row, the same username, the same place — because both products key a User on the identifier their sign-in provider issues. A User is the only kind of person who can own anything: preferences, a feed, saved Stories. Every User reached Saransh as a Visitor first, and may or may not have been a Waitlist Signup. Users are readers of Saransh, never authors of Stories: Stories arrive by Ingest from an Agent, and no User can create or edit one.
_Avoid_: Account, member, reader, subscriber, profile

**Onboarding**:
The questions Saransh asks a User once, immediately after their first sign-in, to make the feed worth reading: reading language, interests, place. Onboarding is per-product, not per-person — a User who completed Rajniti's onboarding has told Saransh nothing, and is still asked. Onboarding only asks what the shared profile cannot already answer, so a User arriving from Rajniti is asked less. It is complete when Saransh says it is, and completion is the gate between signing in and seeing a personalised feed.
_Avoid_: Signup, registration, setup, profile completion, wizard

### Processing Terms

**Chunk**:
A semantic segment of an Article used for embedding and retrieval.
_Avoid_: Segment, piece, part

**Embedding**:
A vector representation of a Chunk stored for semantic search.
_Avoid_: Vector, encoding

**Pipeline**:
The sequence of processors that transform raw scraped content into indexed Stories (scrape → chunk → embed → store).
_Avoid_: Workflow, flow

### Agent Terms

**Agent**:
An autonomous process that performs a specific task (summarization, curation, analysis).
_Avoid_: Bot, worker, service

**Curation Agent**:
Selects and ranks Stories based on relevance, recency, and diversity.
_Avoid_: Ranking agent, selection agent

**Summarization Agent**:
Generates concise summaries from Article content while preserving attribution.
_Avoid_: Summary agent, digest agent

## Example Dialogue

**User**: How does a news story get into Saransh?

**Dev**: A Scraper pulls an Article from a Source. The Pipeline chunks it, generates embeddings, and stores them. The Summarization Agent creates a Summary. The Curation Agent decides if and where to show the resulting Story.

**PM**: What if two outlets report the same event?

**Dev**: They become separate Articles that may be linked to the same Story. The Summary cites both Sources.
