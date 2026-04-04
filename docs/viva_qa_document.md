# MindSafe — Comprehensive Viva/Interview Q&A Document

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend API Gateway](#4-backend-api-gateway)
5. [AI/ML Pipeline — Chatbot Service](#5-aiml-pipeline--chatbot-service)
6. [Emotion Detection Service](#6-emotion-detection-service)
7. [Mood Analytics Service](#7-mood-analytics-service)
8. [Crisis Detection](#8-crisis-detection)
9. [Recommendation Engine](#9-recommendation-engine)
10. [Database Design](#10-database-design)
11. [Security & Encryption](#11-security--encryption)
12. [Authentication System](#12-authentication-system)
13. [Real-Time Features — Anonymous Chat](#13-real-time-features--anonymous-chat)
14. [3D Avatar System](#14-3d-avatar-system)
15. [Deployment & Infrastructure](#15-deployment--infrastructure)
16. [Testing Strategy](#16-testing-strategy)
17. [Scalability & Performance](#17-scalability--performance)
18. [Ethical & Compliance Considerations](#18-ethical--compliance-considerations)
19. [Key Design Decisions & Trade-offs](#19-key-design-decisions--trade-offs)
20. [Killer Questions & Answers](#20-killer-questions--answers)

---

## 1. PROJECT OVERVIEW

### Q: What is MindSafe?

**A:** MindSafe is a **privacy-first mental health platform** built as a full-stack web application with a microservices backend. It provides:

- An **AI emotional companion** (LLM-powered chatbot with emotion awareness)
- **Anonymous peer-to-peer support** (real-time text chat with strangers, fully anonymous)
- **Mood tracking with analytics** (daily mood logs, trend analysis, weekly mental health scores)
- **3D VRM avatars** with emotion-responsive expressions
- **Stress-relief mini-games** (breathing exercises, focus games)
- **End-to-end encryption** of all sensitive user data

The tagline is: _"A safe world where your mind can breathe."_

### Q: What problem does MindSafe solve?

**A:** Traditional mental health apps either lack privacy (collect too much data), are too clinical, or are too expensive. MindSafe addresses:

1. **Privacy barrier** — Many users avoid seeking help because they fear data leaks. MindSafe uses E2E encryption (AES-256-GCM) so even the server cannot read messages.
2. **Accessibility barrier** — 24/7 AI companion available with no appointment, no cost.
3. **Stigma barrier** — Fully anonymous peer chat removes identity, enabling authentic conversations.
4. **Crisis gaps** — Built-in hybrid (keyword + NLP) crisis detection catches danger signals and surfaces helpline resources immediately.

### Q: What is the technical architecture of MindSafe?

**A:** A polyglot microservices architecture:

| Layer             | Technology                                    | Deployment             |
| ----------------- | --------------------------------------------- | ---------------------- |
| Frontend          | Next.js 16 (React 19), Tailwind CSS, Three.js | Vercel (Mumbai region) |
| API Gateway       | Node.js + Express.js 5                        | Render (Singapore)     |
| Chatbot Service   | Python + FastAPI                              | Render                 |
| Emotion Detection | Python + FastAPI + HuggingFace API            | Render                 |
| Mood Analytics    | Python + FastAPI + SQLAlchemy                 | Render                 |
| Crisis Detection  | Python + FastAPI                              | Render                 |
| Recommendation    | Python + FastAPI + scikit-learn               | Render                 |
| Database          | PostgreSQL 15 (Neon serverless)               | Neon Cloud             |
| Cache             | Redis 7 (Upstash)                             | Upstash Cloud          |
| AI Inference      | Groq API (Llama 3.3 70B)                      | Groq Cloud             |
| NLP Models        | HuggingFace Inference API                     | HuggingFace Cloud      |

```
User Browser
     │
     ▼
[Next.js Frontend on Vercel]
     │ HTTPS
     ▼
[Express API Gateway on Render]
     │               │              │
     ▼               ▼              ▼
[Chatbot 8004]  [Emotion 8001]  [Mood 8002]
     │               │
     ▼               ▼
[Groq LLM API]  [HuggingFace API]
                                    │
                                    ▼
                            [PostgreSQL / Neon]
```

---

## 2. SYSTEM ARCHITECTURE

### Q: Why microservices instead of a monolith?

**A:** Five reasons:

1. **Independent deployment** — The chatbot can be updated without redeploying mood analytics. During development we pushed chatbot fixes hourly while mood tracking was stable.
2. **Technology heterogeneity** — Frontend is JavaScript; ML services need Python (transformers, scikit-learn, numpy). Microservices let each service use the best language.
3. **Independent scaling** — The chatbot gets 10x more traffic than mood analytics. On Render, each service has its own container and can scale independently.
4. **Fault isolation** — If the emotion detection service crashes, the chatbot still works (falls back to template-based responses). Mood tracking is completely unaffected.
5. **Team parallelism** — Different developers can work on different services simultaneously without merge conflicts.

**Trade-off acknowledged:** Network overhead between services adds ~50-100ms latency per inter-service call. At our scale (hundreds of users, not millions), this is negligible. We also handle service unavailability gracefully with fallbacks.

### Q: Explain the request flow when a user sends a chat message.

**A:** End-to-end flow:

```
1. User types message in browser
2. Frontend encrypts message with AES-256-GCM (client-side encryption)
   - Key derived from user ID via PBKDF2 (100K iterations)
3. POST /api/chatbot with encrypted envelope in body
4. Express API Gateway:
   a. CORS check (is origin allowed?)
   b. Helmet security headers applied
   c. Rate limit check (500 req/15min in prod)
   d. JSON body parsed (250KB limit)
   e. Input sanitized (HTML tags stripped)
   f. JWT verified → user object attached to req
   g. Decrypt envelope middleware → plaintext content
5. ChatController:
   a. Validates content string
   b. Fetches user profile (for personalized name)
   c. Forwards to Python chatbot service (port 8004)
6. Chatbot Service (FastAPI):
   a. Validates via Pydantic model (1-2000 chars)
   b. Creates/resumes conversation session
   c. Detects intent (keyword heuristics)
   d. Calls emotion detection service (optional, async)
   e. Runs crisis detection (regex + NLP zero-shot classifier)
   f. If crisis HIGH → immediate crisis response with helplines
   g. Otherwise: builds LLM system prompt with:
      - Persona & safety rules
      - Detected emotion + intent + strategy
      - RAG knowledge base (CBT/DBT/mindfulness techniques)
      - Long-term memory (past session summaries)
      - Conversation history
   h. Calls Groq API (Llama 3.3 70B) for response
   i. Quality scoring + anti-repetition check
   j. Returns structured JSON response
7. Express returns response to frontend
8. Frontend displays message with emotion indicator
9. Avatar updates expression based on detected emotion
```

### Q: What is the API Gateway pattern and why use it?

**A:** The Express.js backend acts as a **single entry point** for all frontend requests. Benefits:

- **Single URL** — Frontend only needs `NEXT_PUBLIC_API_URL`. No direct calls to 5 different microservice URLs.
- **Centralized auth** — JWT verification happens once at the gateway, not in every Python service.
- **Centralized security** — Rate limiting, CORS, input sanitization all in one place.
- **Protocol translation** — Frontend sends encrypted envelopes; gateway decrypts before forwarding plaintext to internal services.
- **Service discovery** — Microservice URLs are configured in the gateway's environment; frontend doesn't know about internal topology.

---

## 3. FRONTEND ARCHITECTURE

### Q: Why Next.js 16 with App Router?

**A:**

- **File-system routing** — `src/app/mood/page.js` becomes `/mood`. `src/app/(protected)/` creates a route group for authenticated pages without affecting URLs.
- **Server-Side Rendering (SSR)** — First page load is pre-rendered HTML (faster time-to-interactive, better accessibility).
- **React 19** — Latest React with improved performance reconciliation.
- **Turbopack** — Next.js 16's build tool (successor to Webpack), 10x faster HMR in development.

### Q: Explain the layout and component hierarchy.

**A:**

```
RootLayout (layout.js)
├── ThemeProvider (dark/light mode context)
│   ├── Sidebar (navigation, SOS button, coping tips)
│   └── AuthGuard (route protection)
│       ├── Public routes: /, /login, /signup, /verify-email
│       └── Protected routes (require JWT):
│           ├── /dashboard
│           ├── /ai-companion (AI chatbot + 3D avatar)
│           ├── /anonymous (peer-to-peer chat)
│           ├── /avatar (3D avatar customization)
│           ├── /mood (mood tracking + analytics)
│           ├── /games (stress-relief games)
│           ├── /profile (settings, privacy controls)
│           ├── /insights (emotion analytics)
│           └── /emergency (crisis resources)
```

### Q: How does AuthGuard work?

**A:** It's a synchronous client-side route guard. On every route change:

1. Checks if the route is public (login, signup, etc.) → allow through.
2. Calls `hasValidSession()` which checks if a refresh token exists in localStorage.
3. If no valid session → immediately redirect to `/login`.
4. If session exists (even with expired access token) → allow through because `fetchWithAuth()` will silently refresh the access token on the first API call.

This design avoids a flash of the login page on page refresh — the guard doesn't need to make a network call.

### Q: How does the token refresh mechanism work?

**A:**

```javascript
// authClient.js
fetchWithAuth(url) {
  1. Load tokens from localStorage
  2. If access token expired (with 60s buffer):
     a. Call POST /api/refresh-token with refreshToken
     b. Server validates refresh token + session
     c. Returns new access + refresh token pair
     d. Save new tokens to localStorage
  3. Make API request with valid access token in Authorization header
  4. If 401 response → attempt one refresh, then redirect to login
}
```

Key features:

- **60-second buffer** (`TOKEN_BUFFER_MS`) — refreshes before actual expiry to prevent race conditions.
- **Dual storage** — Memory cache + localStorage for SSR compatibility.
- **Token rotation** — Every refresh generates a new refresh token; old one is invalidated.

### Q: What custom hooks are used and why?

**A:**

| Hook                    | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `useVRMAvatar`          | Manages VRM model lifecycle, emotion mapping, lip sync, gestures      |
| `useEmotionInsights`    | Fetches and caches emotion analytics data                             |
| `useKeyboardNavigation` | Accessibility — full keyboard navigation for all interactive elements |
| `useParallax`           | Decorative parallax scrolling effects                                 |
| `usePreferencesManager` | User preference CRUD with localStorage + API sync                     |
| `useVoicePlayback`      | Text-to-speech for AI companion responses                             |

---

## 4. BACKEND API GATEWAY

### Q: Walk through the Express middleware pipeline.

**A:** Each incoming HTTP request passes through this ordered pipeline:

```
1. helmet()           → Security headers (CSP, HSTS, X-Frame-Options, etc.)
2. securityHeaders    → Additional: Cache-Control: no-store, Permissions-Policy
3. cors()             → Validates Origin against CORS_ORIGINS env var
4. express.json()     → Parse JSON body (250KB limit)
5. sanitizeInput      → Strips HTML tags from all string fields (XSS prevention)
6. apiLimiter         → Rate limit: 500 req/15min (production), 1000 (development)
7. [Route matching]   → Maps URL to controller
8. verifyToken        → JWT verification + session validation
9. decryptEnvelopes   → Auto-decrypts client-encrypted payloads
10. [Controller]      → Business logic
11. notFoundHandler   → 404 for unmatched routes
12. errorHandler      → Centralized error formatting
```

### Q: Explain the security headers and why each matters.

**A:**

| Header                         | Value                                      | Attack Prevented                       |
| ------------------------------ | ------------------------------------------ | -------------------------------------- |
| `X-Content-Type-Options`       | `nosniff`                                  | MIME-type sniffing attacks             |
| `X-Frame-Options`              | `DENY`                                     | Clickjacking (iframe embedding)        |
| `Strict-Transport-Security`    | `max-age=31536000`                         | Downgrade attacks (HTTPS enforcement)  |
| `Referrer-Policy`              | `no-referrer`                              | Information leakage via Referer header |
| `Cache-Control`                | `no-store`                                 | Sensitive data cached in browser/proxy |
| `Permissions-Policy`           | `camera=(), microphone=(), geolocation=()` | Unauthorized device access             |
| `Cross-Origin-Resource-Policy` | `same-site`                                | Cross-origin resource theft            |

### Q: How does rate limiting work and what are the tiers?

**A:** Five separate rate limiters using `express-rate-limit`:

| Endpoint       | Window | Max Requests            | Purpose                  |
| -------------- | ------ | ----------------------- | ------------------------ |
| Login          | 15 min | 10                      | Prevent brute-force      |
| Register       | 1 hour | 5                       | Prevent account spam     |
| OTP            | 15 min | 5                       | Prevent OTP bombing      |
| Password Reset | 15 min | 5                       | Prevent reset abuse      |
| General API    | 15 min | 500 (prod) / 1000 (dev) | Overall abuse prevention |

Rate limiting tracks requests per IP address using in-memory counters. Counters reset when the window expires. Returns `429 Too Many Requests` when exceeded.

### Q: How does input sanitization prevent XSS?

**A:** The `sanitizeInput` middleware recursively processes `req.body`, `req.query`, and `req.params`:

```javascript
function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim(); // Strip HTML tags
  }
  // Recursively process objects and arrays
  // BUT: skip encrypted envelopes (they must not be modified)
  if (value.encrypted === true && typeof value.ciphertext === "string") {
    return value; // Preserve encrypted data integrity
  }
}
```

This prevents stored XSS — if someone sends `<script>alert('xss')</script>` as a message, the HTML tags are stripped before storage.

---

## 5. AI/ML PIPELINE — CHATBOT SERVICE

### Q: Explain the chatbot's response generation pipeline.

**A:** The chatbot uses a **two-tier pipeline**:

```
User Message
     │
     ▼
[Intent Detection] → (greeting, venting, seeking_advice, reflection, etc.)
     │
     ▼
[Emotion Detection] → Call emotion service or use fallback
     │
     ▼
[Crisis Detection] → Keyword regex + NLP zero-shot classification
     │                    │
     │ LOW risk           │ HIGH risk → Immediate crisis response
     ▼
[Strategy Selection] → Dynamic map: (intent, emotion) → [reflect, explore, support, encourage, reframe]
     │
     ▼
[RAG Knowledge Base] → ChromaDB vector search for relevant CBT/DBT/mindfulness techniques
     │
     ▼
[Long-Term Memory] → Redis: past session summaries, user preference history
     │
     ▼
[LLM System Prompt Construction] → Identity + rules + emotion + strategy + RAG + memory
     │
     ▼
[Groq API Call] → Llama 3.3 70B (500 tokens/sec inference)
     │
     ▼
[Quality Scoring] → Anti-repetition check, boundary compliance
     │
     ▼
[Final Response]
```

**Primary tier:** Groq LLM (Llama 3.3 70B) with rich context  
**Fallback tier:** Template-based pipeline (activated when LLM unavailable)

### Q: Why Groq with Llama 3.3 70B instead of OpenAI GPT-4?

**A:**

| Factor             | Groq + Llama 3.3 70B                                      | OpenAI GPT-4                            |
| ------------------ | --------------------------------------------------------- | --------------------------------------- |
| **Cost**           | Free tier available                                       | $30+/month                              |
| **Speed**          | ~500 tokens/sec (LPU hardware)                            | ~50 tokens/sec                          |
| **Vendor lock-in** | Open-source model, can switch providers                   | Proprietary                             |
| **Privacy**        | No data retention on free tier                            | Data may be used for training           |
| **Quality**        | 70B parameters — very capable for empathetic conversation | More capable but overkill for this task |

### Q: What is the conversation strategy engine?

**A:** The strategy engine maps `(intent, emotion)` pairs to conversation strategies:

| Strategy      | When Used                       | Example                                             |
| ------------- | ------------------------------- | --------------------------------------------------- |
| **Reflect**   | User venting about sadness      | "It sounds like you're carrying a lot right now..." |
| **Explore**   | User seeks advice about anxiety | "What specifically triggers this anxiety for you?"  |
| **Support**   | User needs reassurance          | "That's completely normal to feel this way..."      |
| **Encourage** | User sharing good news          | "That's a real achievement! How did it feel?"       |
| **Reframe**   | User stuck in negative thinking | "What if we looked at this differently..."          |

The strategy map in `system_prompt.py` has 14+ explicit mappings. For example:

- `(emotional_venting, sadness)` → `[reflect, support, encourage]`
- `(seeking_advice, anxiety)` → `[explore, reframe, encourage]`

### Q: How does the conversation depth system work?

**A:** Conversations have 4 depth levels that auto-advance based on user turn count:

| Level | Name        | Turns Threshold | Behavior                                 |
| ----- | ----------- | --------------- | ---------------------------------------- |
| 1     | Surface     | 0               | Greetings, factual check-ins             |
| 2     | Exploration | 2+ turns        | Emotional exploration, open questions    |
| 3     | Reflection  | 5+ turns        | Meaning-making, pattern recognition      |
| 4     | Growth      | 8+ turns        | Reframing, goal-setting, forward-looking |

This prevents the AI from jumping into deep psychological territory in the first message and mimics how a real therapist gradually deepens a conversation.

### Q: Explain the RAG (Retrieval-Augmented Generation) knowledge base.

**A:** The `KnowledgeBase` class contains a curated library of **evidence-based therapeutic techniques** across multiple categories:

- **CBT** — Thought records, cognitive distortions, Socratic questioning, exposure hierarchy, decatastrophizing
- **DBT** — TIPP skills, wise mind, radical acceptance, opposite action, ACCEPTS
- **Mindfulness** — 5-4-3-2-1 grounding, body scan, box breathing
- **Self-care** — Sleep hygiene, journaling, gratitude practices

When a user message comes in, the knowledge base is queried by emotion to find relevant techniques. These are injected into the LLM system prompt as context, so the AI can reference specific therapeutic techniques naturally in conversation.

### Q: How does long-term memory work?

**A:** The `MemoryStore` is Redis-backed (with in-memory fallback) and stores:

1. **Session summaries** — After a conversation, key themes and emotions are summarized and stored. Up to 20 summaries per user, 30-day TTL.
2. **User preferences** — Techniques marked as helpful/unhelpful via thumbs-up/down feedback. Stored as `{technique_id: score}` where score increments/decrements.
3. **Memory context injection** — `build_memory_context()` generates a text block injected into the LLM system prompt:

```
Previous sessions:
- User was dealing with exam stress (emotions: anxiety, stress)
- Discussed relationship concerns (emotions: sadness, loneliness)
Techniques this user found helpful: box_breathing, journaling
Techniques this user didn't find helpful: progressive_muscle_relaxation
```

This makes the AI remember past conversations and avoid recommending techniques the user didn't like.

---

## 6. EMOTION DETECTION SERVICE

### Q: How does emotion detection work?

**A:** Two HuggingFace models called via Inference API (no local GPU needed):

**Model 1 — Sentiment:** `distilbert-base-uncased-finetuned-sst-2-english`

- Compressed BERT (60% faster, 97% accuracy)
- Binary classification: POSITIVE / NEGATIVE with confidence
- Mapped to 5-level scale: very_negative → very_positive

**Model 2 — Emotion:** `j-hartmann/emotion-english-distilroberta-base`

- DistilRoBERTa fine-tuned for 7-class emotion classification
- Classes: joy, sadness, anger, fear, surprise, disgust, neutral
- Returns confidence scores for all emotions

**Why cloud API instead of local models?**

- Models need ~1-2GB RAM; Render free tier has 512MB
- API calls take 0.5-2 seconds and are free for reasonable usage
- No GPU required

### Q: How are the emotion results used across the system?

**A:**

1. **Chatbot** — Emotion is injected into the LLM system prompt to make responses emotionally aware.
2. **3D Avatar** — Emotion + intensity drive VRM facial expressions (sad face, happy face, etc.).
3. **Crisis Detection** — Emotion context helps the crisis detector escalate appropriately (sad + "I can't go on" = higher risk than neutral + same phrase).
4. **Mood Analytics** — Emotion scores stored in JSONB column alongside mood logs for trend analysis.
5. **Recommendation Engine** — Emotion type + intensity determine which coping strategies to suggest.

---

## 7. MOOD ANALYTICS SERVICE

### Q: What does the mood analytics service provide?

**A:** A comprehensive mood tracking backend with:

1. **Daily mood logging** — Score (1-10), label, notes, emotion scores, activities, triggers, sleep hours, exercise minutes
2. **Trend analysis** — 7-day and 30-day moving averages, trend direction (improving/declining/stable), linear regression slope
3. **Weekly mental health score** — Composite score (0-100):
   - `(avg_mood / 10) × 70` — Mood level weight (70%)
   - `consistency_ratio × 20` — Logging consistency weight (20%)
   - `stability_score × 10` — Low variance weight (10%)
4. **Visualization-ready data** — Labels, mood scores, moving averages, emotion series formatted for Recharts

### Q: How is the mood data stored?

**A:** SQLAlchemy ORM mapped to PostgreSQL `mood_logs` table:

```sql
mood_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(128),
  logged_date DATE,
  mood_score INTEGER CHECK (1-10),
  mood_label VARCHAR(32),
  notes TEXT,
  emotion_scores JSONB,        -- {"joy": 0.1, "sadness": 0.8, ...}
  activities JSONB,             -- ["exercise", "meditation"]
  triggers JSONB,               -- ["work_stress", "argument"]
  sleep_hours DOUBLE PRECISION,
  exercise_minutes INTEGER,
  time_of_day VARCHAR(16),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Connection pooling:** `pool_size=10, max_overflow=5, pool_recycle=1800` seconds.

---

## 8. CRISIS DETECTION

### Q: How does crisis detection work? What is the hybrid approach?

**A:** A **three-tier hybrid detector**:

**Tier 1 — Keyword Regex (immediate, fast):**

- **HIGH risk** keywords: "kill myself", "end my life", "self-harm", "overdose" → risk_score ≥ 0.85
- **MEDIUM depression** keywords: "hopeless", "worthless", "can't go on" → risk_score ≥ 0.6
- **MEDIUM panic** keywords: "panic attack", "can't cope", "losing control" → risk_score ≥ 0.58
- **Context triggers**: "just broke up", "lost my job", "abuse" → combined with negative emotion → risk_score ≥ 0.55

**Tier 2 — NLP Zero-Shot Classification (semantic understanding):**

- Model: `facebook/bart-large-mnli`
- Loaded in a background thread (non-blocking startup)
- Classifies against labels: "suicidal intent", "self harm intent", "severe depression distress", "panic attack distress", "safe conversation"
- If "suicidal intent" ≥ 0.35 → risk_score ≥ 0.9

**Tier 3 — Risk Level Determination:**

| Total Risk Score | Level  | Action                                                             |
| ---------------- | ------ | ------------------------------------------------------------------ |
| < 0.5            | LOW    | Continue support                                                   |
| 0.5 – 0.79       | MEDIUM | Trigger crisis alert, suggest professional help                    |
| ≥ 0.8            | HIGH   | Immediate escalation, emergency helplines, professional connection |

**Why hybrid?** Keywords catch obvious signals instantly (zero latency). NLP catches semantically similar but differently worded expressions ("I see no future" → suicidal intent even without explicit keywords). Together they minimize both false negatives (missed crises) and false positives (unnecessary alerts).

### Q: What happens when a crisis is detected?

**A:**

1. **HIGH crisis** → Response includes CRISIS_PREAMBLE ("I can hear how much pain you're in..."), followed by helpline resources (988, Crisis Text Line, iCall India, Vandrevala Foundation), CRISIS_CLOSING.
2. **Session status** set to `needs_escalation`.
3. **Crisis resources database** includes US, UK, and India-specific hotlines with 24/7 availability indicators.
4. **Escalation rules** define check frequency: CRITICAL = every 5 min, HIGH = every 1 hour, MEDIUM = every 2 hours.
5. **The AI never replaces professional help** — Safety boundaries in the system prompt explicitly forbid diagnosis, medical advice, or self-harm instructions.

---

## 9. RECOMMENDATION ENGINE

### Q: How does the recommendation engine work?

**A:** A **hybrid rule-based + ML ranking system**:

**Step 1 — Rule Filter:**

- Narrows the strategy library to candidates matching emotion + intensity band
- Intensity bands: LOW (< 0.4), MODERATE (0.4-0.69), HIGH (≥ 0.7)

**Step 2 — Diversity Sampler:**

- Ensures at least one strategy from each relevant category (breathing, grounding, mindfulness, cognitive, physical, etc.)

**Step 3 — ML Ranker (if trained):**

- **Model:** SGDClassifier (logistic loss) from scikit-learn
- **Features:** One-hot emotion (11 classes) + one-hot category (10 classes) + intensity + hour_sin/cos + normalized difficulty = ~25 features
- **Training:** Requires 20+ feedback samples; retrains periodically in-process
- **Falls back to rule engine** when insufficient data

**Step 4 — Feedback Loop:**

- Users give thumbs-up/thumbs-down on recommendations
- FeedbackStore tracks hit rates per strategy
- ML ranker learns personalized preferences over time

### Q: What coping strategies are in the library?

**A:** 20+ evidence-based strategies across 10 categories:

| Category     | Examples                                                    | Evidence Base            |
| ------------ | ----------------------------------------------------------- | ------------------------ |
| Breathing    | 4-7-8 breathing, box breathing, belly breathing             | Relaxation response      |
| Grounding    | 5-4-3-2-1 grounding, ice cube reset, body scan              | CBT, DBT                 |
| Mindfulness  | 1-minute mindfulness, leaves on a stream, PMR               | MBSR, ACT                |
| Physical     | 5-minute walk, desk stretches                               | Exercise therapy         |
| Cognitive    | Thought record, cognitive distortions, Socratic questioning | CBT                      |
| Social       | Reach out to a friend, listen to a podcast                  | Social psychology        |
| Creative     | Art journaling, music listening                             | Art therapy              |
| Self-Care    | Sleep hygiene, nutrition, hydration                         | Wellness                 |
| Journaling   | Gratitude journal, emotion journal                          | CBT, positive psychology |
| Professional | Therapy referral, hotline numbers                           | Clinical                 |

Each strategy has metadata: `min_intensity`, `max_intensity`, `duration_minutes`, `difficulty (1-3)`, `evidence_tags`, `effectiveness_base` score.

---

## 10. DATABASE DESIGN

### Q: Explain the database schema architecture.

**A:** Two database schemas coexist:

**Schema 1 — Application database** (`postgresStore.js`, runtime-created):

| Table               | Contents                                                                                                                                      | Encryption              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `app_users`         | ID, analytics_subject_id, email_digest, email_envelope (encrypted), password_hash_envelope (encrypted), role, token_version, privacy settings | Server-side AES-256-GCM |
| `app_sessions`      | Session ID, user_id, refresh_token_hash, IP hash, user agent hash, revoked_at                                                                 | HMAC hashing            |
| `app_chat_messages` | User ID, message_data (encrypted BYTEA)                                                                                                       | Server-side encryption  |
| `app_mood_entries`  | User ID, mood_data (encrypted BYTEA)                                                                                                          | Server-side encryption  |
| `app_avatars`       | User ID, avatar_data (encrypted BYTEA)                                                                                                        | Server-side encryption  |
| `app_profiles`      | User ID, profile_data (encrypted BYTEA)                                                                                                       | Server-side encryption  |

**Schema 2 — Mood analytics database** (`mood_logs`, SQLAlchemy-managed):

```sql
mood_logs (id, user_id, logged_date, mood_score, mood_label, notes,
           emotion_scores JSONB, activities JSONB, triggers JSONB,
           sleep_hours, exercise_minutes, time_of_day, timestamps)
```

### Q: How is email lookup done if the email is encrypted?

**A:** Using **HMAC-based blind indexing**:

1. On registration: `email_digest = HMAC-SHA256(email, digestKey)` stored as plaintext.
2. On login: compute `HMAC-SHA256(provided_email, digestKey)`, query `WHERE email_digest = ?`.
3. The actual email is in `email_envelope` (AES-256-GCM encrypted), only decrypted after finding the row.

This allows `O(1)` email lookups without storing plaintext emails. Even if the database is stolen, attackers can't reverse the HMAC to get emails.

### Q: What PostgreSQL features are leveraged?

**A:**

- **UUID generation** (`uuid-ossp` extension) — Primary keys are UUIDs, not sequential integers (no enumeration attacks)
- **pgcrypto** — Database-level encryption functions
- **citext** — Case-insensitive text for email uniqueness
- **JSONB columns** — Structured data storage for emotion scores, triggers, activities
- **CHECK constraints** — `mood_score BETWEEN 1 AND 10`, `sentiment_score >= -1.0 AND <= 1.0`
- **Cascading deletes** — `ON DELETE CASCADE` on foreign keys ensures data cleanup
- **Indexes** — Strategic indexes on user_id, email_digest, timestamps for query performance
- **Connection pooling** — `pg` Pool with `max: 20` connections, 30s idle timeout

---

## 11. SECURITY & ENCRYPTION

### Q: Explain the encryption architecture end-to-end.

**A:** **Three layers of encryption:**

**Layer 1 — Transport (TLS 1.3):**

- All HTTP traffic encrypted in transit
- Enforced via `Strict-Transport-Security` header

**Layer 2 — Client-Side Encryption (E2E):**

- **Algorithm:** AES-256-GCM via Web Crypto API
- **Key derivation:** PBKDF2, 100,000 iterations, SHA-256
- **Key material:** User ID (from JWT) + context string ("mindsafe:chat" or "mindsafe:mood")
- **Envelope format:** `{ encrypted: true, alg: "aes-256-gcm", iv, ciphertext, tag, context }`
- Chat messages and mood notes are encrypted in the browser before leaving

**Layer 3 — Server-Side Encryption (at rest):**

- **Algorithm:** AES-256-GCM via Node.js `crypto` module
- **Key derivation:** scrypt (for server keys)
- **Scope:** All PII stored in PostgreSQL: email, name, password hash, chat history, mood data, profiles
- Data is encrypted again before storage, decrypted on retrieval

**Why double encryption?**

- Client-side encryption means even if the server is compromised, stored data is unintelligible without the user's key.
- Server-side encryption adds defense-in-depth — if the database backup is stolen, the encrypted BYTEA columns are useless without the server's encryption key.

### Q: What security measures protect against OWASP Top 10?

**A:**

| OWASP Risk                        | MindSafe Mitigation                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| **A01 Broken Access Control**     | JWT with session validation, token versioning, role-based checks                    |
| **A02 Cryptographic Failures**    | AES-256-GCM encryption, bcrypt (12 rounds) for passwords, HMAC for digests          |
| **A03 Injection**                 | Parameterized SQL queries (pg, SQLAlchemy), input sanitization, Pydantic validation |
| **A04 Insecure Design**           | Least privilege, defense in depth, secure defaults                                  |
| **A05 Security Misconfiguration** | Helmet, hardened CSP, no default credentials in production, env validation          |
| **A06 Vulnerable Components**     | npm audit, dependency pinning, minimal dependency surface                           |
| **A07 Authentication Failures**   | Rate-limited login (10/15min), bcrypt, 4 separate JWT secrets, token rotation       |
| **A08 Data Integrity Failures**   | HMAC integrity verification, JWT signature verification                             |
| **A09 Logging/Monitoring**        | PII-redacted logs, audit trail table, Prometheus metrics                            |
| **A10 SSRF**                      | Internal service URLs not exposed to frontend, URL validation on user inputs        |

---

## 12. AUTHENTICATION SYSTEM

### Q: Explain the JWT authentication flow.

**A:**

```
Registration:
1. POST /api/register { email, password }
2. Password validated (8+ chars, upper, lower, digit, special)
3. Password hashed with bcrypt (12 rounds, random salt)
4. Email digest (HMAC) computed for lookups
5. Email + password hash encrypted (AES-256-GCM) and stored
6. Email verification token generated (JWT, 1h TTL)
7. Verification email sent via Resend (or Nodemailer fallback)

Login:
1. POST /api/login { email, password }
2. Rate limit check (10 attempts / 15 min)
3. Email digest computed, user looked up
4. bcrypt.compare(password, storedHash) — timing-safe comparison
5. If match:
   a. Create session record
   b. Issue access token (15 min TTL, contains: sub, sid, email, role, scope, ver)
   c. Issue refresh token (7 days TTL)
   d. Return both tokens + user metadata

Token Refresh:
1. POST /api/refresh-token { refreshToken }
2. Verify refresh token signature (separate JWT secret)
3. Check session exists and is not revoked
4. Issue new access + refresh token pair (rotation)
5. Invalidate old refresh token

Logout:
1. POST /api/logout (authenticated)
2. Revoke session (set revokedAt timestamp)
3. Token version incremented → all existing tokens for this user invalidated
```

### Q: Why four separate JWT secrets?

**A:**

| Secret                          | Purpose                  | Compromise Impact                       |
| ------------------------------- | ------------------------ | --------------------------------------- |
| `JWT_SECRET`                    | Access tokens            | Short-lived (15m), limited blast radius |
| `JWT_REFRESH_SECRET`            | Refresh tokens           | Can create new access tokens            |
| `JWT_EMAIL_VERIFICATION_SECRET` | Email verification links | Can verify arbitrary emails             |
| `JWT_PASSWORD_RESET_SECRET`     | Password reset links     | Can reset arbitrary passwords           |

If one secret is leaked (e.g., via a log), only that token type is compromised. The others remain secure. This is the **principle of least privilege** applied to cryptographic secrets.

### Q: How does token versioning prevent stolen token reuse?

**A:** Each user has a `tokenVersion` counter in the database. Every JWT includes `ver: tokenVersion`. On logout or password change, `tokenVersion` is incremented. When verifying a token, the middleware checks:

```javascript
if (user.tokenVersion !== decoded.ver) {
  return sendError(res, 401, "Authentication token is no longer valid");
}
```

This instantly invalidates ALL existing tokens for that user, even if they haven't expired yet. It's a server-side revocation mechanism that doesn't require a token blacklist.

---

## 13. REAL-TIME FEATURES — ANONYMOUS CHAT

### Q: How does the anonymous peer-to-peer chat work?

**A:** Built on **Socket.IO** (WebSocket library) with:

**Matching Engine:**

1. User joins queue with preferences: topics (max 6), mood (1-5), communication style, availability, age bracket, trigger warnings
2. Matching engine scores compatibility between queued users
3. Pairs are formed and placed in a private Socket.IO "room"
4. Both users get anonymized names (generated: e.g., "Calm Owl", "Brave Fox")

**Safety Features:**

- **Rate limiting:** 20 messages per 60 seconds per user
- **Safety filters:** `runSafetyChecks()` scans for harmful content
- **Shadow banning:** Reported users are silently placed in a fake queue (never matched)
- **Trust scores:** Users who receive reports lose trust; those who get compliments gain it
- **Reconnect codes:** If one user disconnects, a code like "Calm-Fox-7234" lets them reconnect (stored in Redis, 30-min TTL)
- **Icebreaker prompts:** System message sent after matching to break the ice
- **Safe exit word:** `/exit` command gracefully ends the chat and shows crisis resources
- **Idle timer:** Inactive users get warnings and are eventually disconnected
- **Emotion monitoring:** Messages are sent to the emotion detection service to track emotional trajectory

### Q: Why Socket.IO instead of raw WebSockets?

**A:**

- **Auto-reconnection** on network drops
- **Fallback** to HTTP long-polling if WebSocket is blocked (corporate firewalls)
- **Room abstraction** for private paired conversations
- **Event-based API** with custom events (`sendMessage`, `typing`, `disconnect`)
- **Built-in ping/pong** for connection health detection

---

## 14. 3D AVATAR SYSTEM

### Q: How does the 3D avatar system work?

**A:** A full 3D avatar pipeline:

**Tech Stack:**

- **Three.js** — WebGL-based 3D rendering
- **React Three Fiber** — React renderer for Three.js (JSX 3D components)
- **@pixiv/three-vrm** — VRM avatar format loader (VTuber standard)
- **@react-three/drei** — Helper components (orbit controls, loaders)

**Avatar Features:**

1. **VRM Model Loading** — `.vrm` files loaded via GLTFLoader with VRMLoaderPlugin
2. **Expression Engine** — Maps detected emotions to facial blend shapes (happy, sad, surprised, etc.)
3. **Lip Sync Engine** — Analyzes text/speech to generate mouth movements
4. **Idle Animations** — Subtle breathing, blinking, head sway when not actively emoting
5. **Gesture System** — Waving, nodding, thinking gestures triggered by conversation context
6. **Character Creator** — Color customization for hair, skin, outfit, eyes via material overrides
7. **Camera Control** — Smooth lerp transitions between camera presets (upper body, full body, close-up)
8. **Environment Scene** — Background scenes that match the mood

**Emotion-Responsive Avatar:**
When the AI detects sadness in a user's message, the avatar transitions to an empathetic expression. When the user shares good news, the avatar smiles. This creates an emotionally engaging experience beyond text-only chatbots.

---

## 15. DEPLOYMENT & INFRASTRUCTURE

### Q: Explain the deployment architecture.

**A:**

```
                     ┌─────────────────┐
   Users ──HTTPS──▶  │  Vercel CDN     │  (Next.js frontend)
                     │  Region: Mumbai │
                     └────────┬────────┘
                              │ /api/* rewrites
                              ▼
                     ┌─────────────────┐
                     │  Render.com     │  (API Gateway + 4 Python services)
                     │  Region: SG     │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Neon DB    │  │ Upstash    │  │ Groq API   │
     │ PostgreSQL │  │ Redis      │  │ LLM        │
     └────────────┘  └────────────┘  └────────────┘
```

**Vercel (Frontend):**

- Region: `bom1` (Mumbai) for low latency to Indian users
- Rewrites `/api/*` to backend URL — frontend and API share the same domain from the user's perspective
- Security headers configured in `vercel.json`

**Render (Backend):**

- 6 services defined in `render.yaml` (Blueprint)
- Region: Singapore (closest to India with Render free tier)
- Free tier: 750 hours/month, sleeps after 15 min idle
- Health check paths on all services

**Docker Compose (Local/Staging):**

- PostgreSQL 15 Alpine, Redis 7 Alpine, RabbitMQ 3.12
- All services networked on `mindsafe_network`
- Volume mounts for data persistence
- Health checks with dependencies (`depends_on` with condition)

### Q: How does the Render Blueprint work?

**A:** `render.yaml` is a declarative deployment specification. When connected to GitHub:

1. Render reads the YAML and auto-creates all 6 services
2. Each service has: build command, start command, health check path, environment variables
3. `generateValue: true` auto-generates secrets (JWT_SECRET, etc.)
4. `sync: false` means the value must be set manually in the dashboard
5. Push to `main` triggers automatic redeployment

### Q: Docker Compose — what's the service dependency graph?

**A:**

```
api_gateway
├── depends_on: postgres (healthy)
├── depends_on: redis (healthy)
├── depends_on: rabbitmq (healthy)
└── depends_on: chatbot (healthy)

chatbot → uses redis, emotion_detection, recommendation
emotion_detection → standalone
mood_analytics → uses postgres
crisis_detection → standalone
recommendation → standalone
```

---

## 16. TESTING STRATEGY

### Q: What testing is implemented?

**A:**

**Smoke Tests** (`tests/smoke/`):

- `api-smoke.mjs` — End-to-end API test matrix:
  - Health check, registration, login, token refresh, logout
  - Protected route access without token (expect 401)
  - Invalid input validation (expect 400)
  - Structured error response format verification
- `mood-api-smoke.mjs` — Mood API specific tests

**Integration Tests:**

- `test_mood_logging_integration.py` — Python pytest for mood analytics service
- `test_emotion_detector.py` — Emotion detection model validation

**Run commands:**

```bash
npm run smoke:api             # API smoke tests
npm run smoke:mood            # Mood API tests
npm run smoke:api:compose     # Docker Compose + smoke tests
npm run test:mood:service     # Mood service integration tests
```

---

## 17. SCALABILITY & PERFORMANCE

### Q: How would you scale MindSafe for 100x more users?

**A:**

| Component     | Current                   | Scaled                                              |
| ------------- | ------------------------- | --------------------------------------------------- |
| Frontend      | Vercel (auto-scales)      | Already CDN-distributed                             |
| API Gateway   | Single Render instance    | Multiple instances + load balancer                  |
| Chatbot       | Single instance           | Horizontal scale (stateless), Groq handles LLM load |
| Database      | Neon free tier            | Neon paid with read replicas for analytics          |
| Redis         | Upstash (serverless)      | Already auto-scales                                 |
| Session store | In-memory Maps (fallback) | Redis clusters                                      |
| Message queue | RabbitMQ (Docker)         | Managed CloudAMQP                                   |

**Caching strategy:**

- Redis for user sessions (5 min TTL)
- Computed analytics cached (1 hour TTL)
- Vector embeddings cached (24 hour TTL)

**Database optimization:**

- Read replicas for analytics queries (separate from writes)
- Partitioning `mood_logs` by date for time-series queries
- Connection pool tuning (`max=20` is already configured)

---

## 18. ETHICAL & COMPLIANCE CONSIDERATIONS

### Q: How does MindSafe handle GDPR compliance?

**A:**

| GDPR Right             | Implementation                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| Right to be informed   | Privacy policy, consent management                                       |
| Right of access        | Users can view all their data                                            |
| Right to erasure       | `ON DELETE CASCADE` foreign keys → deleting user removes all data        |
| Right to rectification | Profile editing                                                          |
| Consent                | Explicit opt-in for analytics, research, marketing (separate checkboxes) |
| Data portability       | JSON data export capability                                              |
| Data minimization      | Only collect what's needed; anonymized analytics IDs                     |

### Q: What ethical guardrails does the AI companion have?

**A:** Defined in `system_prompt.py`:

**Safety Boundaries (hard rules):**

- Never diagnose mental illness
- Never replace therapy or professional treatment
- Never provide medical/pharmaceutical advice
- Never provide instructions for self-harm
- Always redirect to professional support when appropriate

**Privacy Rules:**

- Never request unnecessary personal information
- Assume users may want anonymity
- Don't store or repeat identifying details unless voluntarily shared

**Quality Checks (self-reflection loop):**

- Does the response acknowledge the user's emotion?
- Is it empathetic and warm?
- Is it non-repetitive?
- Is it safe, ethical, and within boundaries?
- Does it avoid being robotic or overly clinical?

**Forbidden Tones:** robotic, scripted, sarcastic, dismissive, overly clinical

---

## 19. KEY DESIGN DECISIONS & TRADE-OFFS

### Decision 1: Polyglot Architecture (Node.js + Python)

**Why:** JavaScript is optimal for real-time web (Socket.IO, Next.js ecosystem). Python is optimal for ML (transformers, scikit-learn, numpy). Using both lets each service use the best tool.

**Trade-off:** Operational complexity (two runtimes, two dependency ecosystems). Mitigated by containerization.

### Decision 2: HuggingFace API Instead of Local Models

**Why:** Render free tier has 512MB RAM. Local emotion models need 1-2GB. Cloud API is free for low volume.

**Trade-off:** ~500ms-2s latency per API call + external dependency. Mitigated by fallback to template-based responses if API unavailable.

### Decision 3: In-Memory Fallbacks for Everything

**Why:** Redis, PostgreSQL, emotion service — all may be unavailable (free tier cold starts). Every service has an in-memory fallback (Maps, dicts).

**Trade-off:** In-memory data is lost on restart. But it enables the app to work fully functional without any external dependencies for local development.

### Decision 4: Field-Level Encryption Instead of Column-Level

**Why:** Different fields may need different keys (user-specific E2E encryption vs. server-wide encryption). Field-level gives maximum granularity.

**Trade-off:** Higher computational cost (encrypt/decrypt per field) and more complex code. But it's the gold standard for privacy-sensitive applications.

### Decision 5: Free-Tier-Only Infrastructure

**Why:** University project with zero budget. Every service runs on free tiers (Vercel, Render, Neon, Upstash, Groq, HuggingFace).

**Trade-off:** Cold start latency (~30s on Render free), limited RAM (512MB), sleep after 15 min idle. Mitigated by health check pings and graceful degradation.

---

## 20. KILLER QUESTIONS & ANSWERS

### Q: "If someone sends a suicidal message and your emotion service is down, what happens?"

**A:** The chatbot has **local crisis detection** that is completely independent of the emotion service. The `CrisisDetector` class uses regex-based keyword matching (zero network calls) as its first tier. Even if the NLP classifier AND the emotion service are both down, keyword matching still catches phrases like "kill myself", "want to die", "self-harm". The crisis pipeline NEVER depends on external services for safety-critical detection.

### Q: "Your encryption key is derived from the user ID. Isn't that predictable?"

**A:** The user ID alone isn't sufficient. The key derivation uses PBKDF2 with 100,000 iterations, SHA-256, and a context-specific salt. Even knowing the user ID, an attacker would need to run 100K iterations of PBKDF2 for each decrypt attempt. Additionally, user IDs are opaque random UUIDs (not sequential), and the server never exposes raw user IDs to other users. The real protection is that encrypted data is stored as `BYTEA` blobs — without the user's JWT (which contains their ID), you can't derive the key.

### Q: "You store tokens in localStorage. Isn't that vulnerable to XSS?"

**A:** This is a known trade-off. localStorage is vulnerable to XSS, BUT:

1. Input sanitization strips all HTML tags
2. Content Security Policy restricts script sources
3. React's JSX auto-escapes output by default
4. No `dangerouslySetInnerHTML` usage
5. Alternative (HttpOnly cookies) causes CSRF issues and breaks the token refresh pattern

The defense-in-depth approach ensures XSS is prevented at multiple layers before localStorage is ever reachable.

### Q: "What happens if Groq API goes down or rate-limits you?"

**A:** The `ResponseGenerator` has a **complete template-based fallback pipeline** (v2). If the LLM client fails to initialize, returns an error, or returns a low-quality response:

1. Templates selected based on emotion + intent
2. Cognitive reframing phrases injected
3. Strategy-appropriate follow-up questions generated
4. The response quality degrades gracefully — still empathetic and useful, just less contextually nuanced.

### Q: "How do you prevent one user from reading another user's encrypted messages?"

**A:** Multi-layer isolation:

1. **JWT authentication** — Each request is tied to a user ID via verified JWT.
2. **Database queries** — All queries filter by `WHERE user_id = req.user.id`.
3. **Encryption derivation** — Keys are derived from user ID + context. User A's key cannot decrypt User B's data.
4. **No admin decryption** — Server-side encryption uses the same user-specific key material. There's no master decryption key for E2E encrypted data.

### Q: "Your microservices communicate over HTTP. Isn't that insecure internally?"

**A:** Within Render's private network, services communicate over internal URLs (e.g., `http://chatbot:8004`). This traffic doesn't traverse the public internet. In Docker Compose, all services are on the `mindsafe_network` bridge — isolated from the host. In production, Render provides private networking between services in the same region. For additional security, mTLS (mutual TLS) could be added for inter-service communication.

### Q: "How does the anonymous chat prevent users from revealing personal information?"

**A:** Multiple safety layers:

1. **Anonymized names** — Generated names like "Calm Owl", "Brave Fox" — no real identities
2. **Safety filters** — Messages are scanned for patterns that suggest personal info sharing
3. **No persistence** — Chat messages are ephemeral (not stored on server)
4. **Hashed identifiers** — Socket IDs are hashed; even server logs don't contain identifying info
5. **Shadow banning** — Users who share harmful content get silently isolated

### Q: "What's the most innovative feature of MindSafe?"

**A:** The **emotion-responsive 3D avatar** combined with the **RAG-augmented therapeutic chatbot**. Most mental health chatbots are text-only. MindSafe's AI companion has a visual presence — a 3D VRM avatar that shows empathetic facial expressions, performs gestures, and does lip-sync, all driven in real-time by the detected emotion of the conversation. This creates an embodied conversational agent that feels more like talking to someone than typing at a text box. The RAG knowledge base ensures responses are grounded in evidence-based therapeutic techniques (CBT, DBT, mindfulness), not just generic LLM output.

### Q: "Walk me through what happens from cold boot to the first user message."

**A:**

1. **Render wakes services** — API Gateway starts first (Node.js, ~3s boot), then Python services (~10-30s, model loading)
2. **Database initialization** — PostgreSQL schema created/verified via `initializeDatabase()`
3. **Chatbot startup** — CrisisDetector loads NLP model in background thread; ResponseGenerator lazy-loads Groq client; KnowledgeBase seeds technique library
4. **User opens browser** — Vercel serves Next.js bundle (CDN-cached)
5. **User logs in** — JWT issued, stored in localStorage
6. **User opens AI Companion** — VRM avatar loads via GLTFLoader
7. **User types message** — Message encrypted client-side → POST → Gateway pipeline → Chatbot service → Groq LLM → Response with emotion → Avatar emotes

### Q: "If you could redesign one thing, what would you change?"

**A:** **Move from HuggingFace cloud API to on-device emotion detection using ONNX Runtime Web.** Running the emotion model directly in the browser via WebAssembly would:

- Eliminate the 500ms-2s API call latency
- Remove the HuggingFace dependency
- Keep emotion data fully on-device (even better privacy)
- Work offline

The DistilRoBERTa model can be quantized to ~65MB and runs adequately in the browser via ONNX. This was a planned improvement that time constraints prevented.

---

## QUICK-FIRE TECHNICAL ANSWERS

| Question                       | Answer                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| What LLM model?                | Llama 3.3 70B via Groq API                                      |
| What database?                 | PostgreSQL 15 (Neon serverless)                                 |
| What ORM?                      | SQLAlchemy (Python), pg raw queries (Node.js)                   |
| What web framework (frontend)? | Next.js 16 (React 19, App Router)                               |
| What web framework (backend)?  | Express.js 5 (Node.js), FastAPI (Python)                        |
| How is auth done?              | JWT (access 15m + refresh 7d) with token rotation               |
| Password hashing?              | bcrypt, 12 rounds                                               |
| Encryption algorithm?          | AES-256-GCM                                                     |
| Key derivation?                | PBKDF2 (100K iterations) client-side, scrypt server-side        |
| What real-time protocol?       | Socket.IO (WebSocket + long-polling fallback)                   |
| What 3D engine?                | Three.js + React Three Fiber + @pixiv/three-vrm                 |
| Emotion model?                 | j-hartmann/emotion-english-distilroberta-base (7-class)         |
| Sentiment model?               | distilbert-base-uncased-finetuned-sst-2-english                 |
| Crisis detection?              | Hybrid: regex keywords + facebook/bart-large-mnli zero-shot     |
| CSS framework?                 | Tailwind CSS 3                                                  |
| Charting library?              | Recharts (React + D3.js)                                        |
| Deployment platform?           | Vercel (frontend), Render (backend), Neon (DB), Upstash (Redis) |
| Container orchestration?       | Docker Compose (local), Render Blueprint (prod)                 |
| Message queue?                 | RabbitMQ (local), CloudAMQP (prod)                              |
| Region?                        | Mumbai (Vercel), Singapore (Render)                             |

---

_Document generated from full MindSafe codebase analysis. All answers reference actual implementation in the repository._
