---
title: "Domain Agents - HR & Recruiting + Production-Grade Error Handling"
subtitle: "A comprehensive guide"
difficulty: "Intermediate"
readingTime: 30
handsOnTime: 0
learningObjectives: []
prerequisites: []
tags:
  - "rag"
  - "llm"
  - "ai"
  - "agent"
  - "workflow"
publishedDate: "2025-12-08"
---

# Domain Agents - HR & Recruiting + Production-Grade Error Handling

**Target Audience**: Business users familiar with Blogs 01-06 concepts
**Complexity**: Intermediate
**Time to Build**: 3-4 hours
**Expected ROI**: 75% time reduction (100 hours/month → 25 hours/month)
**Word Count**: ~11,500 words


## Table of Contents

1. [Introduction: From Prototype to Production](#1-introduction)
2. [The Resume Screening Use Case](#2-resume-screening-use-case)
3. [Error Handling Fundamentals](#3-error-handling-fundamentals)
4. [Building the Resume Screening Agent](#4-building-the-agent)
5. [Production-Grade Error Patterns](#5-production-patterns)
6. [HR-Specific Applications](#6-hr-applications)
7. [Conclusion & Next Steps](#7-conclusion)


## 1. Introduction: From Prototype to Production {#1-introduction}

### The Production Gap

You've built your first AI agents. They work beautifully in testing. Lead qualification scores accurately. Support tickets route correctly. Your team is excited.

Then you deploy to production.

Within hours, you discover:
- **PDF parsing fails** on 1 in 10 resumes (scanned images, unusual formatting)
- **LLM timeouts** during high traffic (OpenAI rate limits hit)
- **API failures** cascade through your workflow (ATS integration goes down)
- **Silent failures** lose data (resumes processed but never saved)

**The reality**: Prototypes assume happy paths. Production is full of unhappy paths.

This blog teaches you the difference between a demo agent and a production agent through a real-world use case: **Resume Screening**. You'll learn:

1. **Why error handling matters** (production vs prototype mindset)
2. **Types of failures** (transient vs permanent, graceful degradation)
3. **Error handling patterns** (retry, fallback, circuit breaker, dead letter queue)
4. **Monitoring & alerting** (know when things break, measure success)
5. **Building resilient agents** (handle failures gracefully, never lose data)

By the end, you'll build a production-grade resume screening agent that:
- ✅ **Handles PDF parsing failures** (fallback to manual review)
- ✅ **Manages LLM rate limits** (retry with exponential backoff)
- ✅ **Survives ATS outages** (dead letter queue for failed saves)
- ✅ **Alerts your team** (Slack notifications for anomalies)
- ✅ **Tracks metrics** (processing time, error rate, cost)

**Target outcome**: A system you trust to run unsupervised, processing hundreds of resumes daily without manual intervention.


### Why Resume Screening?

**Universal problem**: Every company hires. High-growth companies receive 500+ resumes/month.

**Manual process pain**:
- **Time-consuming**: 10-15 min/resume × 500 resumes = **83 hours/month**
- **Inconsistent**: Different recruiters apply different criteria
- **Bias-prone**: Unconscious bias in manual screening
- **Slow**: Candidates wait 1-2 weeks for initial response
- **Tedious**: Recruiters burn out on repetitive screening

**AI agent opportunity**:
- **Speed**: 2-3 min/resume → **25 hours/month** (70% reduction)
- **Consistency**: Same criteria applied to every candidate
- **Objectivity**: Reduce unconscious bias (skills-first screening)
- **Fast feedback**: Candidates hear back in 24 hours
- **Focus**: Recruiters spend time on high-value conversations

**ROI calculation**:
```
Time saved: 83 - 25 = 58 hours/month
Cost saved: 58 hours × $50/hour = $2,900/month
Annual savings: $34,800/year

Development cost: 20 hours × $150/hour = $3,000
LLM costs: ~$200/month (500 resumes × $0.40/resume)

Payback period: 1.1 months
Year 1 ROI: ($34,800 - $2,400 - $3,000) / $3,000 = 979% ✅
```

**But**: This ROI only materializes if the system runs reliably in production. A flaky system requires manual intervention (destroying the ROI).


## 2. The Resume Screening Use Case {#2-resume-screening-use-case}

### 2.1 Manual Process Breakdown

**Current state** (100% manual):

1. **Resume arrives** (email, ATS, job board)
   - 15-20 different sources (LinkedIn, Indeed, website form, email)
   - Various formats (PDF, DOCX, scanned images, text-only)
   - Time: 30 seconds to locate and open

2. **Recruiter screens resume** (manual review)
   - Read work history (2-3 min)
   - Identify skills match (2 min)
   - Check education requirements (1 min)
   - Assess culture fit clues (1 min)
   - Time: 6-7 minutes

3. **Recruiter scores candidate** (mental scoring)
   - Technical skills: 1-10
   - Experience level: 1-10
   - Culture fit: 1-10
   - Overall fit: Combined score
   - Time: 1-2 minutes

4. **Recruiter decides next step** (routing)
   - Score > 8: Schedule phone screen
   - Score 5-7: Add to nurture pool
   - Score < 5: Send rejection email
   - Time: 2-3 minutes

5. **Recruiter updates ATS** (data entry)
   - Add candidate record
   - Attach resume
   - Log decision + notes
   - Set follow-up task
   - Time: 3-4 minutes

**Total time per resume**: 12-16 minutes
**Monthly volume** (high-growth company): 500 resumes
**Monthly time investment**: **83-133 hours** (2-3 full-time recruiters)

**Problems**:
- **Inconsistency**: Different recruiters weight criteria differently
- **Fatigue**: Quality degrades after 20-30 resumes in a session
- **Bias**: Unconscious bias creeps in (name, university, formatting quality)
- **Slow feedback**: Candidates wait 1-2 weeks
- **Lost candidates**: Top talent accepts other offers while waiting


### 2.2 AI Agent Solution Architecture

**Goal**: Automate steps 2-5, keep humans in the loop for final decisions

**High-level flow**:
```
Resume arrives (email/ATS)
  → Parse PDF/DOCX (extract text)
  → LLM skill extraction (identify relevant skills)
  → LLM scoring (match vs job requirements)
  → Ranking (prioritize top candidates)
  → ATS update (save results)
  → Notification (alert recruiter to top matches)
```

**Agent components**:

1. **Trigger**: Email attachment OR ATS webhook
2. **PDF Parser**: Extract text from resume
3. **Skill Extractor (LLM)**: Identify technical skills, years of experience
4. **Scorer (LLM)**: Rate candidate 1-100 vs job requirements
5. **Ranker**: Sort candidates by score
6. **ATS Integration**: Save candidate + score to Greenhouse/Lever
7. **Notification**: Slack alert for scores > 80

**Decision points** (where LLM adds value):
- **Skill extraction**: "5 years Python experience" → `{skill: "Python", years: 5}`
- **Scoring**: "Does this candidate meet our Senior Engineer requirements?" → `{score: 85, reasoning: "..."}`
- **Culture fit**: "Does resume suggest alignment with startup culture?" → `{fit_score: 7}`

**What doesn't need LLM** (rules-based logic):
- PDF parsing (deterministic)
- Data validation (check required fields)
- Ranking (sort by score)
- ATS API calls (CRUD operations)

**Expected performance**:
- Time per resume: 2-3 minutes (vs 12-16 manual)
- Consistency: 100% (same criteria every time)
- Bias reduction: Skills-first screening (name/university hidden during scoring)
- Candidate feedback: 24 hours (vs 7-14 days)


### 2.3 What Could Go Wrong? (Error Scenarios)

This is where most tutorials stop. But production systems must handle failures. Here's what will break:

#### PDF Parsing Failures (10-15% of resumes)

**Causes**:
- **Scanned images**: Resume is a photo, not text (no OCR available)
- **Unusual formatting**: Tables, graphics, multi-column layouts confuse parser
- **Password-protected**: Some candidates password-protect their PDFs
- **Corrupted files**: Incomplete uploads, encoding issues

**Impact without error handling**:
- Resume skipped silently (candidate never gets reviewed)
- Workflow crashes (stops processing entire batch)
- Garbage text extracted ("####@@@@" instead of content)

**Production solution** (covered in Section 4.2):
- Try primary parser → Fallback to alternative parser
- If both fail → Store in Dead Letter Queue (DLQ) for manual review
- Alert recruiter to DLQ items daily


#### LLM Rate Limits & Timeouts (5-10% of requests)

**Causes**:
- **Rate limits**: OpenAI tier 1 = 3,500 requests/min (easy to hit with batch processing)
- **Timeouts**: LLM takes > 30 seconds (network issues, complex prompts)
- **API downtime**: OpenAI/Anthropic service outages (rare but happens)

**Impact without error handling**:
- Candidates scored as 0 (missing data)
- Batch processing stops midway (only first 100 resumes scored)
- Inconsistent results (some candidates scored, others not)

**Production solution** (covered in Section 5.1):
- Retry with exponential backoff (3 attempts: 1s, 2s, 4s)
- Rate limiting (max 500 requests/min)
- Circuit breaker (if 10 failures, pause for 5 min)


#### ATS Integration Failures (2-5% of saves)

**Causes**:
- **ATS downtime**: Greenhouse/Lever API unavailable
- **Authentication expiry**: OAuth tokens expire
- **Validation errors**: Required field missing (phone number, source)
- **Network issues**: Timeout, connection reset

**Impact without error handling**:
- Resume processed but not saved (data lost)
- Duplicate candidates created (retry without deduplication)
- Recruiter never sees candidate (no notification sent)

**Production solution** (covered in Section 5.2):
- Dead Letter Queue (store failed saves in Airtable)
- Retry workflow (process DLQ daily)
- Duplicate detection (check email before creating)
- Fallback notification (Slack if ATS save fails)


#### Data Quality Issues (20-30% of resumes)

**Causes**:
- **Missing sections**: No education section, no dates
- **Ambiguous experience**: "Experienced developer" (how many years?)
- **Inconsistent formatting**: "Jan 2020 - Present" vs "2020-01 → current"

**Impact without error handling**:
- LLM extracts wrong data (2020 interpreted as 2020 years of experience)
- Scoring fails (null values break calculation)
- Candidates incorrectly rejected (missing data ≠ unqualified)

**Production solution** (covered in Section 4.4):
- Input validation (check for required fields)
- LLM confidence scores (flag low-confidence extractions)
- Human review queue (recruiter reviews edge cases)


**Key insight**: Production agents spend 40-60% of code handling errors, not happy paths. The difference between a prototype and a production system is error handling.


## 3. Error Handling Fundamentals {#3-error-handling-fundamentals}

### 3.1 Types of Errors

Understanding error types determines your handling strategy.

#### Transient Errors (Temporary, Retryable)

**Definition**: Failures that resolve on their own after a short wait.

**Examples**:
- **Network timeouts**: Request took > 30 seconds
- **Rate limits**: "429 Too Many Requests" from OpenAI
- **Service overload**: "503 Service Unavailable" from ATS
- **Connection resets**: TCP connection dropped mid-request

**Characteristics**:
- ✅ **Retrying works**: 2nd or 3rd attempt usually succeeds
- ✅ **Predictable**: Rate limits follow documented patterns
- ✅ **No data loss**: Request can be safely retried (idempotent)

**Handling strategy**:
```yaml
Pattern: Retry with Exponential Backoff
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 4 seconds
- Max attempts: 3-5

Code pattern:
HTTP Request:
  - Retry On Fail: Yes
  - Max Tries: 3
  - Wait Between Tries: 1000ms
  - Exponential Backoff: Yes
  - Multiplier: 2
```

**When NOT to retry**:
- Side effects (e.g., payment processing - don't charge twice)
- Non-idempotent operations (e.g., "add 1 to counter" - could add 3 times)


#### Permanent Errors (Persistent, Non-Retryable)

**Definition**: Failures that won't resolve by retrying.

**Examples**:
- **Bad input data**: PDF file corrupted, can't be parsed
- **Validation errors**: Email format invalid, required field missing
- **Authentication errors**: "401 Unauthorized" (API key wrong)
- **Not found errors**: "404 Not Found" (resource doesn't exist)

**Characteristics**:
- ❌ **Retrying fails**: Same error every time
- ❌ **Requires intervention**: Human must fix data or configuration
- ✅ **Fast fail**: Detect early, don't waste retries

**Handling strategy**:
```yaml
Pattern: Dead Letter Queue (DLQ)
- Detect permanent error (status code 400-499)
- Store failed item in DLQ (Airtable, database)
- Alert human for manual review
- Don't retry automatically

Code pattern:
IF Node:
  - Condition: {{ $json.statusCode >= 400 && $json.statusCode < 500 }}
  - True: Send to DLQ (permanent error)
  - False: Retry logic (transient error)
```

**Examples**:
- Corrupted PDF → DLQ for manual upload
- Invalid email → DLQ for recruiter to fix
- Missing required field → DLQ with validation errors


#### Systemic Errors (Service-Wide Failures)

**Definition**: Entire service is down or degraded.

**Examples**:
- **API outage**: OpenAI status page shows "Major outage"
- **Database down**: Postgres connection pool exhausted
- **Third-party downtime**: ATS (Greenhouse) unavailable for 2 hours

**Characteristics**:
- ⚠️ **Affects many requests**: Not just one resume, all resumes fail
- ⏱️ **Duration uncertain**: Could be 5 min or 5 hours
- 🔄 **Cascading failures**: Retries make it worse (hammering failing service)

**Handling strategy**:
```yaml
Pattern: Circuit Breaker
- Track failure rate (e.g., last 10 requests)
- If failure rate > 50%: "Open circuit" (stop calling service)
- Wait cooldown period (5-10 min)
- Try 1 request ("half-open" circuit)
- If success: "Close circuit" (resume normal operation)
- If failure: Re-open circuit

Code pattern:
Redis - Track Failures:
  - Key: circuit_breaker:openai
  - Value: {failures: 8, total: 10, last_failure: timestamp}

IF Node:
  - Condition: {{ failures/total > 0.5 && time_since_last_failure < 5min }}
  - True: Circuit OPEN (skip API call, use fallback)
  - False: Circuit CLOSED (proceed normally)
```

**Alternative approach**: Manual circuit breaker (Slack command to pause processing until service recovers)


### 3.2 Error Handling Strategies

#### Strategy 1: Retry with Exponential Backoff

**When to use**: Transient errors (rate limits, timeouts, network issues)

**How it works**:
1. First attempt fails
2. Wait 1 second, retry
3. If fails again, wait 2 seconds, retry
4. If fails again, wait 4 seconds, retry
5. After max retries (3-5), give up → fallback or DLQ

**Why exponential**: Prevents "thundering herd" (1000 requests retrying at same time)

**n8n implementation**:
```yaml
HTTP Request - OpenAI:
  - URL: https://api.openai.com/v1/chat/completions
  - Method: POST
  - Retry On Fail: Yes
  - Max Tries: 3
  - Wait Between Tries: 1000 (1 second)
  - Exponential Backoff: Yes
  - Backoff Multiplier: 2
  - Max Wait: 10000 (10 seconds, cap to avoid infinite waits)

# Retry schedule:
# Try 1: Immediate
# Try 2: +1 second = 1s total
# Try 3: +2 seconds = 3s total
# Try 4: +4 seconds = 7s total (capped at 10s if multiplier too high)
```

**Best practices**:
- **Max retries**: 3-5 (more = wasted time on permanent errors)
- **Timeout per attempt**: 30s (prevents hanging forever)
- **Total timeout**: `max_retries × max_wait + request_time` (e.g., 5 × 10s + 30s = 80s)
- **Jitter**: Add random 0-500ms to prevent synchronized retries


#### Strategy 2: Fallback to Alternative

**When to use**: Primary service fails, backup service available

**Examples**:
- Primary PDF parser (pdfplumber) fails → Fallback to PyPDF2
- Clearbit API down → Fallback to LinkedIn scraper
- Primary LLM (GPT-4) rate limited → Fallback to GPT-3.5

**n8n implementation**:
```yaml
Node 1: HTTP Request - Primary PDF Parser
  - Continue On Fail: Yes

Node 2: IF - Check Success
  - Condition: {{ $json.statusCode === 200 && $json.text.length > 100 }}
  - True: Use primary parser result
  - False: Go to fallback

Node 3 (Fallback): Code Node - Alternative Parser
  - Use different library (PyPDF2 instead of pdfplumber)
  - Lower quality but handles edge cases

Node 4: Merge
  - Combine successful result (either primary or fallback)
  - Flag which parser was used (for quality tracking)
```

**Cost-quality tradeoff**:
- Primary: GPT-4 ($0.03 per resume) - highest quality
- Fallback: GPT-3.5 ($0.01 per resume) - good quality
- Emergency fallback: Manual review ($5 per resume recruiter time)

**Decision logic**:
```javascript
// In Function node
if (gpt4_available && budget_ok) {
  return 'use_gpt4';
} else if (gpt35_available) {
  return 'use_gpt35';
} else {
  return 'queue_manual_review';
}
```


#### Strategy 3: Dead Letter Queue (DLQ)

**When to use**: Permanent errors, items that need manual review

**What it is**: Storage for failed items (Airtable, database, S3)

**Workflow**:
1. Item fails processing (e.g., PDF parse error)
2. Store item in DLQ with:
   - Original data (resume file, metadata)
   - Error details (error message, stack trace)
   - Retry count (how many times attempted)
   - Timestamp (when it failed)
3. Alert team (Slack notification)
4. Daily retry workflow:
   - Fetch DLQ items where `retry_count < 3`
   - Attempt processing again (maybe with improved parser)
   - If success: Remove from DLQ
   - If fail: Increment retry count, alert if count = 3

**n8n implementation**:
```yaml
Node 1: Try Processing Resume
  - Continue On Fail: Yes

Node 2: IF - Check Success
  - Condition: {{ $json.parsed_text }} exists
  - False: Go to DLQ

Node 3 (DLQ): Airtable - Add Failed Resume
  - Table: Resume Processing DLQ
  - Columns:
      - resume_id: {{ $json.candidate_email }}
      - file_url: {{ $json.resume_url }}
      - error_message: {{ $json.error }}
      - retry_count: 0
      - status: pending_manual_review
      - failed_at: {{ $now }}

Node 4: Slack - Alert Recruiter
  - Channel: #recruiting-ops
  - Message: "Resume failed to process: {{ $json.candidate_email }}"
  - Link to Airtable DLQ record

# Separate retry workflow (runs daily at 9am)
Retry Workflow:
  Schedule Trigger: Daily 9am

  Airtable - Get DLQ Items:
    - Filter: status = "pending_manual_review" AND retry_count < 3

  Loop through items:
    - Try processing again (maybe parser improved)
    - IF success: Mark as resolved
    - IF fail: Increment retry_count
    - IF retry_count = 3: Change status to "needs_manual_review"
```

**DLQ schema** (Airtable):
| Field | Type | Description |
|-------|------|-------------|
| resume_id | Text | Candidate email (unique) |
| file_url | URL | Link to original resume file |
| error_message | Long Text | Full error details |
| error_type | Select | PDF_PARSE_ERROR, LLM_TIMEOUT, ATS_SAVE_FAILED |
| retry_count | Number | How many times retried (0-3) |
| status | Select | pending_manual_review, resolved, needs_manual_review |
| failed_at | Date | When it first failed |
| assigned_to | User | Recruiter who will manually review |

**Benefits**:
- ✅ **No data loss**: Every failure recorded
- ✅ **Audit trail**: Track why items failed
- ✅ **Batch processing**: Fix 10 items at once (e.g., update parser, reprocess)
- ✅ **Metrics**: Error rate = DLQ_items / total_items


#### Strategy 4: Circuit Breaker

**When to use**: Systemic failures (service outages, cascading failures)

**Problem it solves**:
- Service is down (e.g., OpenAI outage)
- Your workflow keeps retrying (3 retries × 100 resumes = 300 failed requests)
- Makes problem worse (hammering failing service delays recovery)

**Circuit breaker states**:
```
CLOSED (normal operation)
  ↓ (failure rate > 50%)
OPEN (stop calling service, fail fast)
  ↓ (after 5 min cooldown)
HALF-OPEN (try 1 request to test)
  ↓ (success) → CLOSED
  ↓ (failure) → OPEN again
```

**n8n implementation with Redis**:
```yaml
Node 1: Redis - Get Circuit State
  - Command: GET
  - Key: circuit_breaker:openai
  - Default: {state: "closed", failures: 0, last_check: null}

Node 2: IF - Circuit Open?
  - Condition: {{ $json.state === "open" && $now.diff($json.last_check, 'minutes') < 5 }}
  - True: CIRCUIT OPEN → Skip API call, use fallback or DLQ
  - False: CIRCUIT CLOSED or HALF-OPEN → Proceed to API call

Node 3: HTTP Request - OpenAI
  - Continue On Fail: Yes

Node 4: Update Circuit State
  - IF success:
      - Redis SET circuit_breaker:openai {state: "closed", failures: 0}
  - IF failure:
      - Increment failures
      - IF failures >= 5:
          - Redis SET {state: "open", last_check: $now}
          - Slack alert: "OpenAI circuit breaker OPEN (5 consecutive failures)"
```

**Simplified version** (without Redis):
```yaml
# Track failures in workflow variable
Set Node - Initialize:
  - openai_failures: 0

Loop through resumes:
  IF openai_failures < 5:
    - Try OpenAI request
    - IF success: openai_failures = 0
    - IF fail: openai_failures += 1
  ELSE:
    - Circuit OPEN: Skip OpenAI, send to manual review queue
    - Wait 5 minutes before retrying
```

**When to use circuit breaker vs retry**:
| Scenario | Strategy |
|----------|----------|
| Single request fails | Retry (transient error) |
| 2-3 consecutive failures | Retry (might be temporary) |
| 5+ consecutive failures | Circuit breaker (systemic issue) |
| Entire service down | Circuit breaker (fail fast, don't waste resources) |


### 3.3 Graceful Degradation

**Philosophy**: When something breaks, provide partial service instead of complete failure.

**Examples**:

#### Resume Screening Degradation Levels

**Level 1 - Full automation** (ideal state):
- PDF parsing works
- LLM scoring works
- ATS integration works
- Result: Candidate automatically scored and saved

**Level 2 - Partial automation** (PDF fails):
- PDF parsing fails → Fallback to manual text extraction
- LLM scoring works on manual text
- ATS integration works
- Result: Candidate scored, but required 2 min recruiter time

**Level 3 - Manual scoring** (LLM fails):
- PDF parsing works
- LLM scoring fails → Send parsed text to recruiter
- Recruiter manually scores in 5 min (vs 12 min full manual)
- ATS integration saves manual score
- Result: Still faster than full manual (5 min vs 12 min)

**Level 4 - Emergency fallback** (everything fails):
- Store resume in "Needs Manual Review" folder
- Alert recruiter via Slack
- Recruiter processes completely manually (12 min)
- Result: Same as no automation, but data not lost

**Implementation**:
```yaml
Try Level 1 (Full Automation):
  - Parse PDF
  - IF fails → Try Level 2

Try Level 2 (Partial Automation):
  - Slack recruiter: "Please paste resume text"
  - Wait for Slack response (timeout 30 min)
  - Score pasted text with LLM
  - IF LLM fails → Try Level 3

Try Level 3 (Manual Scoring):
  - Send parsed text to recruiter
  - Recruiter scores manually (1-100)
  - Save manual score to ATS

Level 4 (Emergency Fallback):
  - Store resume in DLQ
  - Alert recruiter
  - Full manual processing
```

**Key principle**: Always have a fallback. Never lose data. Degrade gracefully.


## 4. Building the Resume Screening Agent {#4-building-the-agent}

### 4.1 System Architecture

**High-level workflow**:
```
Email → Extract Attachment → Parse PDF → Extract Skills → Score Candidate → Rank → Save to ATS → Notify
```

**Detailed architecture with error handling**:
```
┌──────────────────────────────────────────────────────────────────┐
│ TRIGGER: Email arrives with resume attachment                     │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: PDF Parsing (with fallback)                               │
│ ┌──────────────┐  FAIL  ┌──────────────┐  FAIL  ┌──────────────┐│
│ │ Primary:     │───────▶│ Fallback:    │───────▶│ DLQ:         ││
│ │ pdfplumber   │        │ PyPDF2       │        │ Manual review││
│ └──────────────┘        └──────────────┘        └──────────────┘│
│        │ SUCCESS                                                  │
│        │ Extracted text (2-5 pages)                               │
└────────┼────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Input Validation                                          │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ CHECK:                                                      │   │
│ │ - Text length > 100 chars? ✓                               │   │
│ │ - Contains "experience" or "skills"? ✓                     │   │
│ │ - Not complete garbage ("####@@@@")? ✓                     │   │
│ └────────────────────────────────────────────────────────────┘   │
│        │ VALID                       │ INVALID                    │
│        │                             ├─────▶ DLQ (bad parse)      │
└────────┼─────────────────────────────┘                            │
         │                                                            │
         ▼                                                            │
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Skill Extraction (LLM with retry)                         │
│ ┌──────────────┐  RETRY  ┌──────────────┐  RETRY  ┌───────────┐ │
│ │ GPT-4        │◀────────│ Wait 1s      │◀────────│ Wait 2s   │ │
│ │ Attempt 1    │  FAIL   │ Attempt 2    │  FAIL   │ Attempt 3 │ │
│ └──────────────┘         └──────────────┘         └───────────┘ │
│        │ SUCCESS                                      │ FAIL      │
│        │ {skills: [...], years: {...}}               ├──▶ DLQ   │
└────────┼──────────────────────────────────────────────┘          │
         │                                                           │
         ▼                                                           │
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Candidate Scoring (LLM with confidence check)             │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ GPT-4: Score candidate vs job requirements                 │   │
│ │ Output: {score: 85, confidence: 0.92, reasoning: "..."}    │   │
│ └────────────────────────────────────────────────────────────┘   │
│        │ confidence > 0.7?                                         │
│        ├─ YES → Use score                                          │
│        └─ NO → Flag for manual review                              │
└────────┼──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: ATS Integration (with DLQ)                                │
│ ┌──────────────┐  FAIL   ┌──────────────┐                        │
│ │ Greenhouse   │────────▶│ DLQ:         │                        │
│ │ Create       │         │ Store failed │                        │
│ │ Candidate    │         │ saves        │                        │
│ └──────────────┘         └──────────────┘                        │
│        │ SUCCESS                                                   │
│        │ Candidate ID: 12345                                       │
└────────┼──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: Notification & Metrics                                    │
│ ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│ │ Slack:           │  │ Airtable:        │  │ Metrics:        │ │
│ │ If score > 80    │  │ Log processing   │  │ Processing time │ │
│ │ Alert recruiter  │  │ Save metrics     │  │ Error rate      │ │
│ └──────────────────┘  └──────────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Error handling summary**:
- **PDF parsing**: Primary → Fallback → DLQ
- **LLM calls**: Retry 3x with backoff → DLQ
- **ATS saves**: Retry 3x → DLQ → Daily batch retry
- **Monitoring**: Log every step, alert on anomalies


### 4.2 Step-by-Step Implementation

#### Step 1: Email Trigger & File Extraction

**Setup Email Trigger**:
```yaml
Email Trigger (IMAP):
  - Server: imap.gmail.com
  - Email: recruiting@company.com
  - Folder: INBOX
  - Poll: Every 5 minutes
  - Filter:
      - Subject contains: "New Application"
      - OR From contains: "@lever.co" (ATS forwarding)
      - Has Attachment: Yes
  - Download Attachments: Yes
  - Mark as Read: Yes (after processing)
```

**Extract resume file**:
```yaml
Function Node - Extract Resume:
  - JavaScript:
      const attachments = $input.item.json.attachments;
      const resume = attachments.find(att =>
        att.fileName.endsWith('.pdf') ||
        att.fileName.endsWith('.docx')
      );

      if (!resume) {
        throw new Error('No PDF or DOCX attachment found');
      }

      return {
        fileName: resume.fileName,
        fileData: resume.dataPropertyName,
        candidateEmail: $json.from,
        candidateName: $json.subject.split('Application from')[1]?.trim() || 'Unknown',
        receivedAt: $now
      };
```

**Error case**: No attachment found
```yaml
Error Trigger Workflow:
  IF error.message contains "No PDF or DOCX":
    - Slack alert: "Resume received without attachment"
    - Gmail: Reply to sender asking for attachment
```


#### Step 2: PDF Parsing with Fallback

**Primary parser (pdfplumber)**:
```yaml
Code Node - Parse PDF (Primary):
  - Libraries: pdfplumber
  - Continue On Fail: Yes
  - JavaScript:
      const pdfplumber = require('pdfplumber');
      const fs = require('fs');

      try {
        // pdfplumber is Python library, use HTTP API or Python subprocess
        const pdfPath = `/tmp/${$json.fileName}`;
        fs.writeFileSync(pdfPath, $json.fileData, 'base64');

        // Call Python script that uses pdfplumber
        const { execSync } = require('child_process');
        const text = execSync(`python3 /scripts/parse_pdf.py "${pdfPath}"`).toString();

        return {
          parsedText: text,
          parser: 'pdfplumber',
          parseSuccess: true,
          textLength: text.length
        };
      } catch (error) {
        // Let fallback handle it
        return {
          parsedText: null,
          parser: 'pdfplumber',
          parseSuccess: false,
          error: error.message
        };
      }
```

**Fallback parser (PyPDF2)**:
```yaml
IF Node - Check Primary Parse:
  - Condition: {{ $json.parseSuccess === false || $json.textLength < 100 }}
  - True: Go to fallback parser
  - False: Continue to validation

Code Node - Parse PDF (Fallback):
  - JavaScript:
      const PyPDF2 = require('pypdf2'); // via Python subprocess

      try {
        const pdfPath = `/tmp/${$('Extract Resume').item.json.fileName}`;
        const text = execSync(`python3 /scripts/parse_pdf_fallback.py "${pdfPath}"`).toString();

        return {
          parsedText: text,
          parser: 'PyPDF2',
          parseSuccess: true,
          textLength: text.length,
          fallbackUsed: true
        };
      } catch (error) {
        // Both parsers failed → DLQ
        return {
          parsedText: null,
          parseSuccess: false,
          error: error.message,
          fallbackUsed: true
        };
      }
```

**DLQ for unparseable resumes**:
```yaml
IF Node - Both Parsers Failed:
  - Condition: {{ $json.parseSuccess === false && $json.fallbackUsed === true }}
  - True: Send to DLQ

Airtable - DLQ Failed Parses:
  - Table: Resume Parsing DLQ
  - Record:
      - Candidate Email: {{ $('Extract Resume').item.json.candidateEmail }}
      - File Name: {{ $('Extract Resume').item.json.fileName }}
      - Error: PDF parsing failed (both pdfplumber and PyPDF2)
      - Error Details: {{ $json.error }}
      - Retry Count: 0
      - Status: pending_manual_review
      - Failed At: {{ $now }}
      - File URL: (upload to S3/Google Drive)

Slack - Alert Recruiter:
  - Channel: #recruiting-ops
  - Message: |
      ⚠️ Resume failed to parse:
      **Candidate**: {{ $('Extract Resume').item.json.candidateName }}
      **Error**: PDF parsing failed
      **Action needed**: Please manually review: [Airtable link]
```

**Success metrics to track**:
```yaml
Airtable - Log Parse Metrics:
  - Table: Resume Processing Metrics
  - Record:
      - Candidate Email: {{ $('Extract Resume').item.json.candidateEmail }}
      - Parser Used: {{ $json.parser }}
      - Fallback Used: {{ $json.fallbackUsed }}
      - Parse Time: {{ $now.diff($('Extract Resume').item.json.receivedAt, 'seconds') }}
      - Text Length: {{ $json.textLength }}
      - Success: {{ $json.parseSuccess }}
```

**Daily metrics review**:
- Primary parser success rate: 85-90%
- Fallback parser success rate: 8-10%
- DLQ rate: 2-5%
- If DLQ > 10%: Investigate (maybe update parser library)


#### Step 3: Input Validation

**Validate parsed text quality**:
```yaml
Function Node - Validate Parse:
  - JavaScript:
      const text = $json.parsedText;

      // Check 1: Minimum length
      if (!text || text.length < 100) {
        return {
          valid: false,
          reason: 'Text too short (< 100 chars)',
          text: text
        };
      }

      // Check 2: Not complete garbage
      const garbageRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
      if (garbageRatio > 0.3) {
        return {
          valid: false,
          reason: 'Too many special characters (likely parse error)',
          text: text
        };
      }

      // Check 3: Contains resume keywords
      const keywords = ['experience', 'education', 'skills', 'work', 'university', 'job'];
      const hasKeywords = keywords.some(kw => text.toLowerCase().includes(kw));
      if (!hasKeywords) {
        return {
          valid: false,
          reason: 'Missing resume keywords (not a resume?)',
          text: text
        };
      }

      return {
        valid: true,
        text: text,
        wordCount: text.split(/\s+/).length
      };

IF Node - Validation Check:
  - Condition: {{ $json.valid === false }}
  - True: Send to DLQ
  - False: Continue to skill extraction
```

**Why validation matters**: LLMs fail gracefully on bad input (hallucinate skills instead of error). Better to catch early.


#### Step 4: Skill Extraction (LLM with Retry)

**Job requirements** (configured per job posting):
```yaml
Set Node - Job Requirements:
  - Variable: job_requirements
  - Value:
      role: "Senior Backend Engineer"
      required_skills:
        - Python (5+ years)
        - Django/Flask (3+ years)
        - PostgreSQL (3+ years)
        - Docker/Kubernetes (2+ years)
        - AWS (2+ years)
      preferred_skills:
        - GraphQL
        - Redis
        - Terraform
      education: "BS in Computer Science or equivalent experience"
      experience_level: "5-8 years backend development"
```

**LLM skill extraction with retry**:
```yaml
OpenAI Node - Extract Skills:
  - Model: gpt-4-turbo
  - Temperature: 0.1 (low = consistent)
  - Max Tokens: 500
  - Retry On Fail: Yes
  - Max Tries: 3
  - Wait Between Tries: 1000ms
  - Exponential Backoff: Yes

  - System Message: |
      You are a resume parsing assistant. Extract technical skills and experience from resumes.
      Output ONLY valid JSON. Be precise with years of experience.

  - User Message: |
      Extract skills from this resume:

      {{ $('Validate Parse').item.json.text }}

      Output JSON format:
      {
        "technical_skills": [
          {"skill": "Python", "years": 7, "confidence": 0.9},
          {"skill": "Django", "years": 5, "confidence": 0.85}
        ],
        "education": {
          "degree": "BS Computer Science",
          "university": "MIT",
          "graduation_year": 2015
        },
        "total_experience_years": 8,
        "current_title": "Senior Software Engineer",
        "confidence": 0.92
      }

      Guidelines:
      - Only include technical skills (not soft skills)
      - Years of experience must be numeric (estimate if ranges given)
      - Confidence 0-1 (how sure you are about the data)
      - If something is unclear, set confidence low
```

**Parse LLM response**:
```yaml
Function Node - Parse Skills:
  - JavaScript:
      try {
        const response = $json.choices[0].message.content;
        const data = JSON.parse(response);

        // Validate response structure
        if (!data.technical_skills || !Array.isArray(data.technical_skills)) {
          throw new Error('Invalid LLM response: missing technical_skills array');
        }

        return {
          skills: data.technical_skills,
          education: data.education,
          experience_years: data.total_experience_years,
          current_title: data.current_title,
          extraction_confidence: data.confidence,
          extraction_success: true
        };
      } catch (error) {
        return {
          extraction_success: false,
          error: error.message,
          raw_response: $json.choices[0].message.content
        };
      }
```

**Handle low confidence extractions**:
```yaml
IF Node - Check Confidence:
  - Condition: {{ $json.extraction_confidence < 0.7 || $json.extraction_success === false }}
  - True: Flag for manual review
  - False: Continue to scoring

Airtable - Low Confidence Queue:
  - Table: Manual Review Queue
  - Record:
      - Candidate: {{ $('Extract Resume').item.json.candidateName }}
      - Issue: Low confidence skill extraction
      - Confidence Score: {{ $json.extraction_confidence }}
      - Extracted Skills: {{ JSON.stringify($json.skills) }}
      - Parsed Text: {{ $('Validate Parse').item.json.text }}
      - Status: needs_recruiter_review
```

**Cost tracking**:
```yaml
Set Node - Track LLM Cost:
  - Prompt tokens: {{ $json.usage.prompt_tokens }}
  - Completion tokens: {{ $json.usage.completion_tokens }}
  - Cost: {{ ($json.usage.prompt_tokens * 0.00001) + ($json.usage.completion_tokens * 0.00003) }}
  # GPT-4 Turbo: $0.01 per 1K prompt tokens, $0.03 per 1K completion tokens
```


#### Step 5: Candidate Scoring (LLM with Confidence)

**Score candidate vs job requirements**:
```yaml
OpenAI Node - Score Candidate:
  - Model: gpt-4-turbo
  - Temperature: 0.1
  - Max Tokens: 300
  - Retry On Fail: Yes
  - Max Tries: 3

  - System Message: |
      You are a technical recruiter. Score candidates 1-100 based on job fit.
      Be objective and consistent. Output ONLY JSON.

  - User Message: |
      Score this candidate for our {{ $('Job Requirements').item.json.role }} position.

      JOB REQUIREMENTS:
      {{ JSON.stringify($('Job Requirements').item.json, null, 2) }}

      CANDIDATE SKILLS:
      {{ JSON.stringify($('Parse Skills').item.json.skills, null, 2) }}

      CANDIDATE EXPERIENCE:
      - Total years: {{ $('Parse Skills').item.json.experience_years }}
      - Current title: {{ $('Parse Skills').item.json.current_title }}
      - Education: {{ JSON.stringify($('Parse Skills').item.json.education) }}

      Output JSON:
      {
        "overall_score": 85,
        "skill_match_score": 90,
        "experience_match_score": 80,
        "education_match_score": 85,
        "confidence": 0.92,
        "reasoning": "Candidate has 7 years Python (exceeds 5 year requirement)...",
        "missing_skills": ["GraphQL", "Terraform"],
        "recommendation": "interview" // interview | maybe | reject
      }

      Scoring guidelines:
      - 90-100: Exceptional fit (all required skills + years match)
      - 75-89: Strong fit (most requirements met)
      - 60-74: Moderate fit (some gaps but trainable)
      - Below 60: Weak fit (major gaps)
```

**Parse scoring response**:
```yaml
Function Node - Parse Score:
  - JavaScript:
      try {
        const response = $json.choices[0].message.content;
        const score = JSON.parse(response);

        // Validate score
        if (score.overall_score < 0 || score.overall_score > 100) {
          throw new Error('Invalid score (must be 0-100)');
        }

        // Categorize
        let category;
        if (score.overall_score >= 80) category = 'hot_lead';
        else if (score.overall_score >= 60) category = 'warm_lead';
        else category = 'cold_lead';

        return {
          ...score,
          category: category,
          scoring_success: true
        };
      } catch (error) {
        return {
          scoring_success: false,
          error: error.message
        };
      }
```


#### Step 6: ATS Integration with Dead Letter Queue

**Create candidate in Greenhouse (with retry)**:
```yaml
HTTP Request - Greenhouse Create Candidate:
  - Method: POST
  - URL: https://harvest.greenhouse.io/v1/candidates
  - Authentication: Basic Auth
    - User: {{ $credentials.greenhouse_api_key }}
    - Password: (leave blank)

  - Retry On Fail: Yes
  - Max Tries: 3
  - Wait Between Tries: 2000ms

  - Body:
      {
        "first_name": "{{ $('Extract Resume').item.json.candidateName.split(' ')[0] }}",
        "last_name": "{{ $('Extract Resume').item.json.candidateName.split(' ').slice(1).join(' ') }}",
        "email_addresses": [
          {
            "value": "{{ $('Extract Resume').item.json.candidateEmail }}",
            "type": "personal"
          }
        ],
        "phone_numbers": [],
        "applications": [
          {
            "job_id": {{ $('Job Requirements').item.json.greenhouse_job_id }},
            "source_id": {{ $credentials.greenhouse_source_id }},
            "custom_fields": {
              "ai_score": {{ $('Parse Score').item.json.overall_score }},
              "skill_match": {{ $('Parse Score').item.json.skill_match_score }},
              "missing_skills": "{{ $('Parse Score').item.json.missing_skills.join(', ') }}",
              "ai_reasoning": "{{ $('Parse Score').item.json.reasoning }}"
            }
          }
        ],
        "attachments": [
          {
            "filename": "{{ $('Extract Resume').item.json.fileName }}",
            "type": "resume",
            "content": "{{ $('Extract Resume').item.json.fileData }}",
            "content_type": "application/pdf"
          }
        ]
      }

IF Node - Check ATS Save:
  - Condition: {{ $json.statusCode === 201 }}
  - True: Success, continue to notification
  - False: Save failed, go to DLQ
```

**Dead Letter Queue for failed ATS saves**:
```yaml
Airtable - DLQ Failed Saves:
  - Table: ATS Save DLQ
  - Record:
      - Candidate Email: {{ $('Extract Resume').item.json.candidateEmail }}
      - Candidate Name: {{ $('Extract Resume').item.json.candidateName }}
      - Score: {{ $('Parse Score').item.json.overall_score }}
      - Skills: {{ JSON.stringify($('Parse Skills').item.json.skills) }}
      - Error: {{ $json.error.message }}
      - Status Code: {{ $json.statusCode }}
      - Retry Count: 0
      - Status: pending_retry
      - Failed At: {{ $now }}
      - Resume URL: (upload resume to Google Drive for manual access)

Slack - Alert ATS Failure:
  - Channel: #recruiting-ops
  - Message: |
      ❌ Failed to save candidate to Greenhouse
      **Candidate**: {{ $('Extract Resume').item.json.candidateName }}
      **Score**: {{ $('Parse Score').item.json.overall_score }}
      **Error**: {{ $json.error.message }}
      **Action**: Candidate data saved to DLQ, will auto-retry tomorrow
```

**Daily DLQ retry workflow**:
```yaml
Schedule Trigger:
  - Cron: 0 9 * * * (daily at 9am)

Airtable - Get DLQ Items:
  - Table: ATS Save DLQ
  - Filter: status = "pending_retry" AND retry_count < 3

Loop Through DLQ:
  - HTTP Request - Retry Greenhouse Save
    - (same as above)

  - IF success:
      - Airtable Update: status = "resolved"
      - Slack: "✅ Candidate {{ name }} successfully saved to Greenhouse"

  - IF fail:
      - Increment retry_count
      - IF retry_count >= 3:
          - status = "needs_manual_review"
          - Slack: "⚠️ Candidate {{ name }} failed 3 times, needs manual save"
```


#### Step 7: Notification & Ranking

**Slack notification for top candidates**:
```yaml
IF Node - High Score:
  - Condition: {{ $('Parse Score').item.json.overall_score >= 80 }}
  - True: Send Slack alert

Slack - Hot Candidate Alert:
  - Channel: #recruiting-hot-leads
  - Message: |
      🎯 **High-Score Candidate**

      **Name**: {{ $('Extract Resume').item.json.candidateName }}
      **Email**: {{ $('Extract Resume').item.json.candidateEmail }}
      **Score**: {{ $('Parse Score').item.json.overall_score }}/100

      **Skill Match**: {{ $('Parse Score').item.json.skill_match_score }}
      **Experience Match**: {{ $('Parse Score').item.json.experience_match_score }}

      **Reasoning**: {{ $('Parse Score').item.json.reasoning }}

      **Missing Skills**: {{ $('Parse Score').item.json.missing_skills.join(', ') }}

      **Recommendation**: {{ $('Parse Score').item.json.recommendation }}

      <{{ $('Greenhouse Save').item.json.candidate_url }}|View in Greenhouse>

  - Blocks:
      - type: actions
        elements:
          - type: button
            text: Schedule Interview
            url: {{ $('Greenhouse Save').item.json.candidate_url }}
            style: primary
```

**Daily digest for all candidates**:
```yaml
Schedule Trigger:
  - Cron: 0 17 * * * (daily at 5pm)

Airtable - Get Today's Candidates:
  - Table: Resume Processing Metrics
  - Filter: created_at >= TODAY

Aggregate - Calculate Stats:
  - Total processed: {{ count($input.all()) }}
  - Average score: {{ avg($input.all().map(i => i.json.score)) }}
  - Hot leads (>= 80): {{ $input.all().filter(i => i.json.score >= 80).length }}
  - Warm leads (60-79): {{ $input.all().filter(i => i.json.score >= 60 && i.json.score < 80).length }}
  - Cold leads (< 60): {{ $input.all().filter(i => i.json.score < 60).length }}
  - Parse failures: {{ $input.all().filter(i => !i.json.parse_success).length }}

Slack - Daily Digest:
  - Channel: #recruiting-ops
  - Message: |
      📊 **Resume Processing Daily Report**

      **Today's Stats**:
      - Total resumes processed: {{ stats.total }}
      - Average score: {{ stats.avg_score }}/100

      **Breakdown**:
      - 🔥 Hot leads (80+): {{ stats.hot_count }}
      - ⭐ Warm leads (60-79): {{ stats.warm_count }}
      - ❄️ Cold leads (<60): {{ stats.cold_count }}

      **Errors**:
      - Parse failures: {{ stats.parse_failures }}
      - DLQ items: {{ stats.dlq_count }}

      <{{ stats.airtable_url }}|View Details>
```


### 4.3 Testing & Validation

**Test scenarios**:

1. **Happy path**: Well-formatted PDF, clear experience, high score
2. **PDF edge cases**: Scanned image, multi-column, password-protected
3. **LLM edge cases**: Ambiguous experience ("years of experience in programming"), missing sections
4. **Rate limiting**: Process 100 resumes simultaneously
5. **ATS failures**: Network timeout, validation error, duplicate candidate

**Test data**:
```yaml
# Create 20 test resumes:
- 10 well-formatted PDFs (should all succeed)
- 5 scanned image PDFs (should hit fallback parser)
- 3 corrupted PDFs (should go to DLQ)
- 2 text-only resumes (should succeed with manual paste)
```

**Success metrics** (after processing 100 test resumes):
```
✅ Parse success rate: 92% (10% fallback, 3% DLQ) → Target: >85%
✅ Skill extraction accuracy: 95% (spot-check 20 resumes) → Target: >90%
✅ Scoring consistency: Stdev 5 points (same resume scored 3x) → Target: <10
✅ Processing time: Avg 2.5 min/resume → Target: <3 min
✅ Cost per resume: $0.35 (2 LLM calls × $0.15 + $0.05 parsing) → Target: <$0.50
✅ Error rate: 3% (3 DLQ items) → Target: <5%
```


## 5. Production-Grade Error Patterns {#5-production-patterns}

### 5.1 Monitoring & Alerting

**What to monitor**:

1. **Processing metrics**:
   - Resumes processed per hour
   - Average processing time (target: <3 min)
   - Success rate (target: >95%)

2. **Error metrics**:
   - Parse failure rate (target: <10%)
   - LLM timeout rate (target: <5%)
   - ATS save failure rate (target: <2%)
   - DLQ size (target: <5 items/day)

3. **Cost metrics**:
   - LLM tokens used per resume
   - Cost per resume (target: <$0.50)
   - Monthly total cost (budget: $250 for 500 resumes)

4. **Quality metrics**:
   - Skill extraction confidence (target: >0.8 avg)
   - Scoring confidence (target: >0.9 avg)
   - Manual review rate (target: <10%)

**Alerting rules**:
```yaml
Alert: High Error Rate
  - Trigger: Error rate > 10% in last hour
  - Severity: WARNING
  - Action: Slack #recruiting-ops
  - Message: "⚠️ Resume processing error rate elevated ({{ error_rate }}%). Check logs."

Alert: DLQ Backlog
  - Trigger: DLQ size > 10 items
  - Severity: WARNING
  - Action: Slack #recruiting-ops
  - Message: "📋 {{ dlq_size }} resumes in Dead Letter Queue. Manual review needed."

Alert: Cost Spike
  - Trigger: Daily cost > $20 (400% of normal)
  - Severity: CRITICAL
  - Action: Slack #recruiting-ops + Email VP Engineering
  - Message: "🚨 Resume processing cost spike detected: ${{ daily_cost }}. Investigating."

Alert: Processing Stopped
  - Trigger: No resumes processed in last 2 hours (during business hours)
  - Severity: CRITICAL
  - Action: Slack #recruiting-ops + PagerDuty
  - Message: "🚨 Resume processing appears stopped. Last resume: {{ last_resume_time }}."
```

**Monitoring dashboard** (Airtable + Slack Bot):
```yaml
Schedule Trigger: Every hour

Airtable - Get Last Hour Stats:
  - Table: Resume Processing Metrics
  - Filter: created_at >= LAST_HOUR

Calculate Metrics:
  - Total processed: {{ count }}
  - Success rate: {{ successes / total × 100 }}%
  - Average score: {{ avg(scores) }}
  - Parse failures: {{ parse_failures }}
  - LLM failures: {{ llm_failures }}
  - ATS failures: {{ ats_failures }}
  - DLQ additions: {{ dlq_additions }}
  - Total cost: ${{ sum(costs) }}

Check Alert Conditions:
  - IF error_rate > 10% → Trigger "High Error Rate" alert
  - IF dlq_size > 10 → Trigger "DLQ Backlog" alert
  - IF daily_cost > $20 → Trigger "Cost Spike" alert
  - IF total_processed = 0 AND business_hours → Trigger "Processing Stopped" alert
```


### 5.2 Rate Limiting Implementation

**Problem**: OpenAI tier 1 = 3,500 requests/min. Processing 500 resumes in batch = 1,000 LLM calls (2 per resume) in <5 min = rate limit hit.

**Solution**: Batch processing with rate limiting

```yaml
Node 1: Airtable - Get Unprocessed Resumes
  - Filter: status = "pending_processing"
  - Order: created_at ASC
  - Limit: 500

Node 2: Split In Batches
  - Batch Size: 50 (process 50 resumes at a time)
  - Rate Limit: 10000 (wait 10 seconds between batches)

Node 3: Loop Through Batch
  - Process each resume (2 LLM calls per resume)
  - 50 resumes × 2 calls = 100 LLM calls per batch
  - 100 calls / 10 seconds = 10 calls/second
  - 10 calls/sec × 60 sec = 600 calls/minute (well below 3,500 limit) ✅

Node 4: Wait 10 Seconds
  - Ensures rate limit respected

Node 5: Loop Back to Next Batch
  - Process next 50 resumes
```

**Calculate safe batch size**:
```javascript
// OpenAI rate limit
const rate_limit_per_minute = 3500; // tier 1
const safety_margin = 0.5; // use 50% of limit (buffer for other workflows)
const safe_requests_per_minute = rate_limit_per_minute * safety_margin; // 1,750

// Resume processing
const llm_calls_per_resume = 2; // skill extraction + scoring
const batch_wait_seconds = 10; // wait between batches

// Calculate batch size
const batches_per_minute = 60 / batch_wait_seconds; // 6 batches/min
const safe_batch_size = Math.floor(safe_requests_per_minute / batches_per_minute / llm_calls_per_resume);
// = 1,750 / 6 / 2 = 145 resumes per batch

console.log(`Safe batch size: ${safe_batch_size} resumes`);
// Use 50 for extra safety margin
```


### 5.3 Logging & Audit Trail

**Log every step**:
```yaml
Airtable - Processing Log:
  - Table: Resume Processing Log
  - Record per resume:
      - Timestamp: {{ $now }}
      - Candidate Email: {{ email }}
      - Step: "pdf_parse" | "skill_extraction" | "scoring" | "ats_save"
      - Status: "success" | "failure" | "retry"
      - Duration: {{ step_duration_ms }}
      - Error: {{ error_message }} (if failed)
      - Metadata: {{ JSON.stringify(step_data) }}
```

**Benefits**:
- **Debugging**: Trace exactly where a resume failed
- **Performance**: Identify slow steps (e.g., PDF parsing taking 30s)
- **Audit**: Prove candidate was processed (compliance)
- **Analytics**: Which steps fail most often?

**Example log entry**:
```json
{
  "timestamp": "2024-01-15T14:23:45Z",
  "candidate_email": "john@example.com",
  "step": "skill_extraction",
  "status": "retry",
  "attempt": 2,
  "duration_ms": 3200,
  "error": "OpenAI timeout (30s)",
  "metadata": {
    "model": "gpt-4-turbo",
    "prompt_tokens": 1250,
    "completion_tokens": 0,
    "timeout_seconds": 30
  }
}
```

**Query examples**:
```sql
-- Find all candidates that failed skill extraction
SELECT * FROM processing_log
WHERE step = 'skill_extraction' AND status = 'failure'
AND timestamp > NOW() - INTERVAL '7 days';

-- Average processing time per step
SELECT step, AVG(duration_ms) as avg_duration
FROM processing_log
WHERE status = 'success'
GROUP BY step;

-- Error rate by step (last 24 hours)
SELECT
  step,
  COUNT(*) FILTER (WHERE status = 'failure') as failures,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'failure') / COUNT(*), 2) as error_rate_pct
FROM processing_log
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY step
ORDER BY error_rate_pct DESC;
```


## 6. HR-Specific Applications {#6-hr-applications}

### 6.1 Interview Scheduling Automation

**Problem**: After resume screening, schedule phone screen with top candidates.

**Workflow extension**:
```yaml
After Resume Scoring:
  IF score >= 80:
    - Google Calendar - Find Available Slot
      - Recruiter: {{ assigned_recruiter }}
      - Duration: 30 minutes
      - Date range: Next 5 business days
      - Prefer: 2pm-4pm

    - Zoom - Create Meeting
      - Topic: "Phone Screen - {{ candidate_name }}"
      - Duration: 30 min

    - Google Calendar - Create Event
      - Attendees: [candidate_email, recruiter_email]
      - Location: {{ zoom_link }}
      - Send Invites: Yes

    - Gmail - Send Confirmation
      - To: {{ candidate_email }}
      - Subject: "Interview Scheduled - {{ company_name }}"
      - Body: |
          Hi {{ candidate_name }},

          We were impressed by your background and would like to schedule
          a phone screen to discuss the {{ job_title }} role.

          Time: {{ event_time }}
          Duration: 30 minutes
          Join: {{ zoom_link }}

          Looking forward to speaking with you!

          Best,
          {{ recruiter_name }}
```

**Error handling**:
- Recruiter calendar unavailable → Try next recruiter in rotation
- Zoom API fails → Create Google Meet instead
- Candidate email bounces → Slack alert to recruiter


### 6.2 Candidate Nurture Campaigns

**Problem**: Warm leads (60-79 score) should be nurtured, not immediately rejected.

**Workflow**:
```yaml
After Resume Scoring:
  IF score >= 60 AND score < 80:
    - Mailchimp - Add to Nurture List
      - List: "Qualified Candidates - Warm Pool"
      - Tags: [{{ job_department }}, {{ seniority_level }}]
      - Custom Fields:
          - Score: {{ score }}
          - Skills: {{ skills }}
          - Applied Date: {{ $now }}

    - n8n Workflow - Nurture Campaign
      - Email 1 (Immediate): "Thank you for applying"
      - Email 2 (+3 days): "Here's what it's like to work at {{ company }}"
      - Email 3 (+7 days): "We have other roles that might interest you"
      - Email 4 (+30 days): "Are you still looking? We're hiring for..."

    - Airtable - Track Engagement
      - Email opens: {{ open_count }}
      - Link clicks: {{ click_count }}
      - Re-engagement: IF clicks > 2 → Move to "Active Candidate Pool"
```

**Re-engagement trigger**:
```yaml
Mailchimp Webhook - Email Clicked:
  - Event: campaign.clicked

  Airtable - Update Candidate:
    - engagement_score += 10
    - last_interaction: {{ $now }}

  IF engagement_score > 50:
    - Slack - Notify Recruiter:
        "{{ candidate_name }} just clicked 3 links in nurture emails.
         Consider reaching out for phone screen."
```


### 6.3 Onboarding Workflow Automation

**Problem**: Candidate accepts offer → 20+ onboarding tasks (IT, HR, facilities).

**Workflow**:
```yaml
Greenhouse Webhook - Candidate Hired:
  - Event: candidate.hired
  - Trigger: Onboarding workflow

Multi-Agent Onboarding System:

Agent 1: HR Setup
  - BambooHR - Create Employee Profile
  - DocuSign - Send offer letter, I-9, W-4
  - Benefits Portal - Send enrollment link
  - Slack: Add to #new-hires channel

Agent 2: IT Setup
  - Google Workspace - Create email (firstname.lastname@company.com)
  - 1Password - Create account
  - GitHub - Add to company org
  - Slack: Add to engineering channels
  - IT Ticket - Order laptop (auto-assigned to IT team)

Agent 3: Facilities Setup
  - Envoy - Create office access badge
  - Robin - Assign desk
  - Slack: Send office tour schedule

Agent 4: Onboarding Schedule
  - Google Calendar - Create onboarding events:
      - Day 1: Orientation (9am-12pm)
      - Day 1: IT setup (1pm-2pm)
      - Day 2: Team meet & greet (10am-11am)
      - Week 1: 1-on-1 with manager (daily)
      - Week 2: Department overview sessions
  - Zoom - Create meeting links for all events
  - Gmail - Send calendar invites

Agent 5: Welcome Communication
  - Gmail - Send welcome email with:
      - First day details
      - What to bring
      - Dress code
      - Parking/transit info
      - Links to all systems
  - Slack DM from CEO: "Welcome to the team!"

Merge Results:
  - Airtable - Onboarding Checklist:
      ☑ HR profile created
      ☑ IT systems provisioned
      ☑ Office access arranged
      ☑ Calendar events scheduled
      ☑ Welcome email sent

  - Slack - Notify Hiring Manager:
      "{{ candidate_name }} onboarding complete.
       Start date: {{ start_date }}.
       All systems ready."
```

**Error handling**:
- IT system unavailable → Queue for manual setup, alert IT team
- Calendar conflict → Find alternative time, notify manager
- Email bounce → Use phone number, Slack DM instead


## 7. Conclusion & Next Steps {#7-conclusion}

### 7.1 What You've Learned

In this blog, you've learned the critical difference between **prototype agents** and **production agents**:

**Prototypes**:
- ✅ Work on happy paths
- ❌ Fail silently on errors
- ❌ No monitoring or alerting
- ❌ Can't handle scale (rate limits)
- ❌ Lose data on failures

**Production systems**:
- ✅ Handle unhappy paths gracefully
- ✅ Retry transient errors (exponential backoff)
- ✅ Fallback to alternatives when primary fails
- ✅ Dead Letter Queue for manual review
- ✅ Circuit breakers prevent cascading failures
- ✅ Comprehensive monitoring and alerting
- ✅ Never lose data (audit trail)

**Key patterns mastered**:
1. **Retry with exponential backoff** (transient errors)
2. **Fallback to alternative service** (primary unavailable)
3. **Dead Letter Queue** (permanent errors, manual review)
4. **Circuit breaker** (systemic failures, prevent cascades)
5. **Rate limiting** (respect API limits, prevent hammering)
6. **Monitoring & alerting** (know when things break)
7. **Logging & audit trail** (debug issues, prove compliance)


### 7.2 Resume Screening ROI Recap

**Investment**:
- Development time: 20 hours × $150/hour = **$3,000**
- Monthly LLM costs: 500 resumes × $0.40 = **$200/month**
- Infrastructure: n8n cloud ($50/month) + Pinecone ($0) = **$50/month**

**Returns**:
- Time saved: 83 hours → 25 hours = **58 hours/month**
- Cost saved: 58 hours × $50/hour = **$2,900/month**
- Annual savings: **$34,800/year**

**Payback**: 1.1 months
**Year 1 ROI**: **979%** ✅

**But only if it runs reliably**. Error handling makes the difference.


### 7.3 Production Checklist

Before deploying any AI agent to production, ensure:

**Error Handling**:
- [ ] Retry logic with exponential backoff (3-5 attempts)
- [ ] Fallback services configured (primary + backup)
- [ ] Dead Letter Queue for failed items
- [ ] Circuit breaker for systemic failures (optional but recommended)
- [ ] Rate limiting to respect API limits
- [ ] Input validation (catch bad data early)

**Monitoring**:
- [ ] Success rate tracking (target: >95%)
- [ ] Error rate alerts (trigger if >10%)
- [ ] Processing time metrics (target: <3 min/item)
- [ ] Cost tracking (LLM tokens, API calls)
- [ ] DLQ size monitoring (alert if >10 items)

**Alerting**:
- [ ] Slack alerts for critical errors
- [ ] Daily digest for team (summary stats)
- [ ] Cost spike alerts (if >400% of normal)
- [ ] Processing stopped alerts (if 0 items in 2 hours)

**Logging**:
- [ ] Comprehensive logging (every step, every resume)
- [ ] Audit trail (prove compliance, debug issues)
- [ ] Performance logs (identify slow steps)

**Testing**:
- [ ] 100+ test resumes (happy paths + edge cases)
- [ ] Load testing (500 resumes in batch)
- [ ] Failure injection (simulate API outages)
- [ ] Cost validation (actual cost vs projected)

**Documentation**:
- [ ] Runbook for common errors ("What to do when...")
- [ ] Escalation path (who to contact for what issue)
- [ ] Configuration documentation (all API keys, settings)


### 7.4 Next Steps: Blog 08 Preview

In **Blog 08**, we'll level up to **Multi-Agent Systems**:

**Topic**: Executive Assistant Agent (5 specialized agents working in parallel)

**Agents**:
1. **Email Manager**: Triage inbox, draft responses, flag urgent
2. **Calendar Optimizer**: Find conflicts, suggest reschedules, block focus time
3. **Meeting Preparer**: Pull background docs, create agendas, send reminders
4. **Task Prioritizer**: Score tasks by urgency × impact, suggest daily plan
5. **Report Summarizer**: Extract key metrics, generate executive summary

**Patterns you'll learn**:
- **Agent specialization**: One job per agent (vs monolithic)
- **Parallel execution**: 5 agents run simultaneously → 5x faster
- **Result synthesis**: Merge agent outputs into cohesive action plan
- **Supervisor pattern**: Coordinator agent manages worker agents

**Why multi-agent**:
- Single agent doing 5 tasks → 15 min execution time
- 5 specialized agents in parallel → 3 min execution time (5x faster)
- Each agent has optimized prompt (better accuracy)
- Easier to debug (isolate which agent failed)

**Preview example**:
```yaml
Multi-Agent Executive Assistant:

Input: Morning briefing request

Parallel Agents (run simultaneously):
  - Email Manager: "12 unread, 3 urgent"
  - Calendar Optimizer: "Conflict at 2pm, suggest reschedule"
  - Meeting Preparer: "3 meetings today, agendas ready"
  - Task Prioritizer: "5 high-priority tasks, 15 min total"
  - Report Summarizer: "Sales up 12%, support tickets down 8%"

Merge Results:
  - Generate morning briefing (2-min read)
  - Present action plan (top 3 priorities)
  - Flag urgent items (reply to CEO email)

Output: Comprehensive morning brief in 3 minutes (vs 15 min manual)
```

**Stay tuned for Blog 08!** 🚀


## Appendix A: Code Repository

**Complete n8n workflow JSON**: [GitHub link - resume-screening-agent.json]

**Key files**:
- `resume-screening-main.json` - Main workflow (PDF → Score → ATS)
- `dlq-retry.json` - Daily DLQ processing workflow
- `monitoring-dashboard.json` - Hourly metrics collection
- `python-scripts/parse_pdf.py` - Primary PDF parser (pdfplumber)
- `python-scripts/parse_pdf_fallback.py` - Fallback parser (PyPDF2)

**Setup instructions**:
1. Import workflow JSON to n8n
2. Configure credentials (OpenAI, Greenhouse, Slack, Gmail)
3. Upload Python scripts to server (or use Code node)
4. Create Airtable base (tables: Processing Log, DLQ, Metrics)
5. Test with 10 sample resumes
6. Deploy to production with monitoring enabled


## Appendix B: Error Message Reference

**Common errors and solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| `PDF parsing failed: Invalid PDF structure` | Corrupted file | Send to DLQ for manual review |
| `OpenAI timeout (30s)` | Network issue or large prompt | Retry with backoff (3 attempts) |
| `429 Too Many Requests` | Rate limit hit | Implement rate limiting (10 calls/sec) |
| `Greenhouse validation error: Email required` | Missing email field | Add validation before ATS save |
| `Circuit breaker OPEN` | 5+ consecutive API failures | Wait 5 min, service likely down |
| `Low confidence extraction (0.45)` | Ambiguous resume text | Flag for manual review |
| `DLQ size > 10` | High error rate | Investigate root cause (parser issue?) |


**Word count**: ~11,500 words ✅
**Time to build**: 3-4 hours
**Expected ROI**: 75% time reduction, $34,800/year savings
**Production-ready**: Yes (with all error handling implemented)


*Next: Blog 08 - Multi-Agent Systems (Executive Assistant)*
