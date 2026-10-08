# Saransh — Domain Glossary

**शोर नहीं। सिर्फ़ खबर। सबूत के साथ।** / **No noise. Just news. With proof.**

Saransh is an open-source news app for India: up to 50 short, sourced stories a day, in Hindi or English, approved by a person, with no personalisation and no algorithm.

This file is the project's vocabulary. Use these words in code, commits, issues and reviews. It defines what the words mean; for what is actually built, read [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md). Where a term describes something planned and not yet in the code, it says so.

## Language

### Story Terms

**Story**:
A news event with a headline and a Summary in both Hindi and English, its Sources, an image, and metadata (Tier, State, Topic). A Story may draw on several Articles from different Sources.
_Avoid_: Article, news item, post

**Article**:
A single source document from an outlet or an official body. Several Articles may contribute to one Story. Saransh reads Articles through RSS, licensed feeds and official sources; it does not scrape article pages.
_Avoid_: Story, news piece

**Source**:
An approved outlet or official body that a Story is drawn from. A Source enters the Source Registry only after its reuse terms are checked. Each Story lists every Source that reports the event.
_Avoid_: Publisher, feed

**Source Registry**:
The public list of approved Sources and how each may be used (RSS, licensed, official). Planned; the list itself is the founder's decision.
_Avoid_: Whitelist, source list

**Official Source**:
A government body or ministry. Only a Story from an Official Source shows the green tick, and only an Official Source's photo may be used as a Story image. A newspaper or news agency is never an Official Source.
_Avoid_: Verified source, trusted source

**Summary**:
The short text of a Story: at most 60 words in English and 70 in Hindi. Drafted by AI, approved by a person, fact-only, with every claim attributed ("according to police…" / "पुलिस के अनुसार…").
_Avoid_: Excerpt, blurb, digest

**Citation Link**:
The single canonical Article a Story's Summary was written from, stored on the Story as `source_url`. Distinct from the Story's `sources`, which list every outlet that reports the event. A Story has at most one Citation Link and may have many Sources. The card's "Read story" button and source line link to it.
_Avoid_: Primary source, origin link, reference

**Tier**:
Which of three kinds of news a Story is. **National**: central government, Parliament, Supreme Court, RBI and other central bodies, or anything affecting more than one state. **State**: the main subject is one state. **International**: happens outside India and names India, an Indian entity, Indians abroad, or a direct effect on India. There is no district or city Tier. Planned as a field; not in the code yet.
_Avoid_: Level, scope, region

**State**:
Geography only: the Indian state or union territory a State-tier Story is about, and the state a User chose at Onboarding. Never use "state" for where a Story sits in its lifecycle; that is Publication Status.
_Avoid_: Region, place, location

**Topic**:
The one primary subject of a Story: Politics, Civic, Education, Business & Economy or Crime. Entertainment and Sports are "coming soon": a User can register interest, and their Stories are left out of the feed. Topic is shown as a text label, never by colour alone. Today the code stores a free-text `category`; the fixed list is planned.
_Avoid_: Category, tag, section

### Lifecycle Terms

**Ingest**:
The act of accepting a structured Story, with its Sources, over the API (`POST /api/v1/stories`, guarded by an API key).
_Avoid_: Upload, submit, push, create

**Publication Status**:
Where a Story sits in its lifecycle. **Today:** every Story is Published the moment it is ingested; the Draft step was removed on 2026-09-25 and `published_at` was dropped on 2026-10-01. **Planned:** `draft` → `in_review` → `published`, then `corrected` or `retracted`, with `published_at` restored. Nothing reaches readers until a person approves it.
_Avoid_: State (reserved for geography), stage, visibility

**Review**:
A person reading a Story in both Hindi and English beside its source, then approving, editing or killing it, and confirming or correcting its Tier, State and Topic. One Review per Story. Only the review team does this; contributors and volunteers do not. Planned.
_Avoid_: Moderation, QA, approval queue

**Correction**:
A public record that a published Story was changed: the field, the old value, the new value, the reason and the date. Corrections and grievances are raised as GitHub Issues. The corrections log is planned.
_Avoid_: Edit, fix, update

**Stopgap Routine**:
The scheduled Claude Code routine (`docs/story-ingest-routine.md`) that fills the site today. It is not the Pipeline: its Stories are published without Review and may carry a publisher's image. A recorded, temporary exception that ends when the Pipeline and the publish step exist.
_Avoid_: The pipeline, the scraper, the bot

### Reader Terms

**Visitor**:
Someone reading the Saransh site, counted anonymously per browser. A Visitor is not a Waitlist Signup — one Visitor may create several Signups, and one Signup may be made from several Visitors. A Visitor is not a User either: a Visitor is a browser Saransh has not identified, so the moment one signs in they are a User for the rest of that browser's session. Saransh never learns an unidentified Visitor's name or email.
_Avoid_: Session, traffic, audience

**Guest**:
A Visitor reading Stories in the app before signing in. A Guest sees 6 National and International Stories, counted toward the day's 50, then the sign-in wall. A Guest's progress carries over when they sign in. Planned.
_Avoid_: Anonymous user, trial user

**Waitlist Signup**:
A person who asked to be told when Saransh launches. Identified by email; signing up twice is the same Signup, not two. Carries a Signup Token for anything outside Saransh that needs to refer to it. A Signup is not a User — it is an email we promised to contact, with no credentials and nothing to sign in to. A Signup may later become a User, and the Signup Token is what lets us say they are the same person.
_Avoid_: Subscriber, lead, waitlister

**Signup Token**:
The opaque public identifier of a person Saransh has identified — not the email, and not the row number. Issued at whichever moment identification first happens: joining the Waitlist, or signing in. Stable: a second signup with the same email yields the same Token, and a User whose verified email matches an existing Signup inherits that Signup's Token rather than being issued a new one. It is how Saransh recognises one person across Visitor, Waitlist Signup and User without the email leaving the system. Planned with analytics; not in the code yet.
_Avoid_: Signup ID, user ID, waitlist ID

**User**:
A person who has signed in with Google and therefore has a durable identity Saransh recognises across browsers and devices. One User is one person across both Saransh and Rajniti — the same row in the shared `users` table, which Rajniti owns. A User is the only kind of person who can own anything: preferences, read history, saved Stories. Users are readers of Saransh, never authors of Stories. Planned.
_Avoid_: Account, member, subscriber, profile

**Onboarding**:
The questions Saransh asks a User once, right after their first sign-in: reading language (required, nothing pre-selected), State (required) and up to 3 Topics (optional). The name is prefilled from Google and editable. There is no username step and no district question. Onboarding is per-product: a User who completed Rajniti's onboarding has told Saransh nothing, and is still asked. Planned.
_Avoid_: Signup, registration, setup, profile completion, wizard

**Edition**:
One batch of cards a reader gets in a sitting. A day holds four Editions of 15, 15, 10 and 10 Stories, 50 in all, with a 4-hour wait counted from the end of an Edition and a reset at midnight IST. "Edition" is the word in the app, the docs and the code. Planned.
_Avoid_: Session, batch, round

**Feed Mix**:
The fixed, public rules that decide which Stories a reader sees: daily Tier minimums (National 25, State 15, International 10), the reader's chosen Topics at about 60% within each Tier, Tiers interleaved, newest first. It depends only on the reader's chosen language, State and Topics, the Story's Tier, State, Topic and time, and how much of the day's 50 is used. Nothing is learned from clicks, reading time or analytics. Planned.
_Avoid_: Ranking, recommendation, algorithm, personalisation

### Pipeline Terms

**Pipeline**:
The planned sequence that turns Articles into published Stories: fetch from approved Sources → dedupe → summarise → translate → tag → Agent check → Review → publish. It runs on local AI (Ollama) and fails per Story, not per batch. Not built yet.
_Avoid_: Workflow, flow, scraper

**Agent**:
An automated process that drafts or checks. An Agent never approves a Story and never decides what a reader sees.
_Avoid_: Bot, worker, service

**Summariser**:
The Agent that drafts a Summary in the Article's language and translates it to the other, within the word limits. Its prompts are versioned and public.
_Avoid_: Summary agent, digest agent

**Tagger**:
The Agent that proposes a Story's Tier, State and Topic. The reviewer confirms or corrects; corrections are logged to measure the Tagger.
_Avoid_: Classifier, categoriser

**Checker**:
The Agent that does a first pass before Review: word count, attribution present, Summary matches the source, Hindi and English say the same thing. It flags; it never approves.
_Avoid_: Validator agent, QA bot

**Word-Limit Validator**:
Code, not an Agent: English ≤ 60 words, Hindi ≤ 70, hard reject. A word is anything between spaces; punctuation does not count. Planned.
_Avoid_: Length check, soft limit

## Example Dialogue

**User**: How does a news story get into Saransh?

**Dev**: The plan: the Pipeline fetches an Article from an approved Source, the Summariser drafts a Summary in both languages, the Tagger proposes a Tier, State and Topic, and the Checker flags anything that looks wrong. A reviewer then reads both languages beside the source and approves, edits or kills the Story. Only an approved Story is Published.

**PM**: And today?

**Dev**: Today the Stopgap Routine ingests Stories and they are Published as they arrive, with no Review. That is a known, temporary exception.

**PM**: What if two outlets report the same event?

**Dev**: They are separate Articles behind one Story. The Story lists both Sources, and its Citation Link points to the one Article the Summary was written from.

**PM**: Who decides what a reader sees?

**Dev**: The Feed Mix rules and the reader's own choices at Onboarding. Nothing is learned from what they tap.
