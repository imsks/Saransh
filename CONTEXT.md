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
