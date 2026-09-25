# Mercav Pwn — Production Implementation Plan

## 0. Mission

Implement `pwn.mercav.lat` as a production-ready cybersecurity intelligence and digital-exposure module inside Mercav.

Pwn must remain visually and architecturally part of Mercav while having its own security-focused information architecture.

Primary goals:

1. Detect and explain digital exposure.
2. Query legitimate breach/exposure APIs.
3. Aggregate defensive threat-intelligence feeds.
4. Monitor domains, organizations, emails and assets.
5. Provide near-real-time alerts.
6. Correlate breaches, vulnerabilities, indicators, campaigns and threat actors.
7. Produce transparent risk/confidence assessments.
8. Generate executive and technical reports.
9. Provide legal-context information without pretending to determine criminal liability or sentencing.
10. Never turn Pwn into a repository for stolen credentials, passwords, malware, private personal data, or raw illicit dumps.

The product should be useful to individuals, developers, companies and security teams, especially in Latin America.

---

# 1. Existing Mercav Context

The current Mercav application uses:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma ORM
- PostgreSQL/MySQL-compatible persistence
- NextAuth authentication
- Next.js Route Handlers / Server Actions

Existing major application areas include:

- `app/api`
- `app/admin`
- `app/dashboard`
- `app/herramientas`
- `app/comunidad`
- `app/empleos`
- `app/servicios`
- `app/mensajes`
- `app/perfil`

Do not rewrite or destabilize existing Mercav modules.

Pwn should be implemented as a modular domain.

Suggested structure:

```text
app/
├── pwn/
│   ├── page.tsx
│   ├── exposure/
│   ├── breaches/
│   ├── threats/
│   ├── vulnerabilities/
│   ├── actors/
│   ├── organizations/
│   ├── monitor/
│   ├── alerts/
│   ├── reports/
│   └── settings/
│
├── api/
│   └── pwn/
│       ├── exposure/
│       ├── breaches/
│       ├── threats/
│       ├── vulnerabilities/
│       ├── actors/
│       ├── organizations/
│       ├── monitoring/
│       ├── alerts/
│       └── reports/
│
components/
└── pwn/
    ├── dashboard/
    ├── exposure/
    ├── breaches/
    ├── threats/
    ├── vulnerabilities/
    ├── actors/
    ├── organizations/
    ├── alerts/
    ├── reports/
    └── shared/

lib/
├── pwn/
│   ├── risk-engine.ts
│   ├── confidence-engine.ts
│   ├── correlation-engine.ts
│   ├── normalization.ts
│   ├── alert-engine.ts
│   ├── legal-context.ts
│   ├── redaction.ts
│   └── permissions.ts
│
└── integrations/
    └── pwn/
        ├── hibp.ts
        ├── nvd.ts
        ├── cisa-kev.ts
        ├── misp.ts
        └── abuse-ch.ts

prisma/
└── schema.prisma
```

Do not blindly create every file above if an existing architecture already provides an equivalent abstraction. Reuse Mercav's conventions.

---

# 2. Product Identity

Product name:

**Mercav Pwn**

Suggested positioning:

> Cyber Intelligence & Exposure Monitoring

Suggested product language:

> Detect. Investigate. Protect.

Pwn must feel like a premium Mercav product, not an unrelated cybersecurity website.

---

# 3. Visual Design

Preserve Mercav's existing visual identity:

- Deep dark mode
- Black / gold / cream
- Glassmorphism
- High contrast
- Cinematic transitions
- Framer Motion micro-animations
- Modern typography
- Spacious layouts
- Premium dashboard feel

Suggested Pwn base palette:

```text
Background       #050505
Surface          #0B0B0B
Surface Elevated #111111
Border           rgba(255,255,255,0.08)
Gold             #D4AF37
Gold Soft        #F5E6B3
Text             #FFFFFF
Muted            #94A3B8
```

Security state colors should be semantic and restrained:

```text
Critical
High
Medium
Low
Informational
Verified
Unverified
```

Do not turn the entire interface red/yellow/green.

Use state colors only for statuses and alerts.

---

# 4. Global Navigation

Add Pwn to the existing Mercav navigation.

Suggested:

```text
Mercav
├── Ads
├── Services
├── Jobs
├── Community
├── Tools
└── Pwn
```

Pwn internal navigation:

```text
Overview
Exposure
Breaches
Threat Intelligence
Vulnerabilities
Organizations
Threat Actors
Monitoring
Alerts
Reports
API
Settings
```

---

# 5. Public Pwn Landing Page

Route:

```text
/pwn
```

Create a polished landing/dashboard entry point.

Hero:

```text
MERCAV PWN

Cyber Intelligence & Exposure Monitoring

Discover digital exposure.
Understand risk.
Respond with confidence.

[ Analyze Exposure ]
[ Explore Threat Intelligence ]
```

Below the hero:

- Exposure search
- Threat statistics
- Latest verified intelligence
- Latest vulnerability intelligence
- Recent alerts
- Product explanation
- Data-source transparency
- Privacy/security explanation

Do not expose sensitive raw data on the public landing page.

---

# 6. Exposure Search

Core route:

```text
/pwn/exposure
```

Search types:

```text
Email
Domain
Organization
Username
IP
Hash
Breach ID
```

Important:

- Validate and normalize input.
- Rate-limit public searches.
- Never log raw credentials.
- Never store plaintext passwords.
- Never expose complete passwords.
- Never expose session tokens.
- Never expose authentication cookies.
- Never expose raw private records from illicit dumps.
- Redact personal data that is not required for the security analysis.

The UI should show findings as exposure metadata.

Example:

```text
Exposure detected

Email:
v••••••@example.com

Data types:
Email
Username
Password hash
IP address

Source:
Example Breach

First observed:
2026-09-01

Source confidence:
High

Exposure risk:
High
```

---

# 7. Password Checking

Implement password exposure checking only through privacy-preserving mechanisms.

Preferred architecture:

```text
Client
  ↓
Local SHA-1 hash
  ↓
Send only required prefix/range information
  ↓
Remote password exposure service
  ↓
Compare locally
```

Never send or store plaintext passwords.

Never build a password database.

Never display passwords from a breach.

---

# 8. Breach Model

Every breach/event must contain provenance.

Minimum fields:

```text
id
name
description
discoveredAt
publishedAt
firstSeenAt
lastSeenAt
source
sourceUrl
sourceType
verificationStatus
confidenceScore
claimedRecordCount
verifiedRecordCount
dataTypes
affectedOrganizations
affectedDomains
severity
createdAt
updatedAt
```

Verification status:

```text
UNVERIFIED
PARTIALLY_CORROBORATED
CORROBORATED
CONFIRMED
DISPUTED
```

Never treat an unverified claim as confirmed fact.

---

# 9. Source Reliability

Every source must have a reliability model.

Suggested fields:

```text
sourceName
sourceType
historicalReliability
verificationMethod
lastEvaluatedAt
notes
```

Confidence should be calculated separately from source reliability.

Example:

```text
Source Reliability: 31/100
Event Confidence: 24/100
Verification: Unverified
```

This distinction is mandatory.

---

# 10. Threat Intelligence Ingestion

Build an ingestion layer instead of hard-coding source-specific logic into UI routes.

Architecture:

```text
External Source
      ↓
Connector
      ↓
Raw Event
      ↓
Normalizer
      ↓
Deduplicator
      ↓
Correlation
      ↓
Confidence
      ↓
Risk
      ↓
Alert
      ↓
Dashboard
```

All connectors must:

- Use official APIs or permitted feeds whenever possible.
- Respect provider terms.
- Respect rate limits.
- Store source attribution.
- Store ingestion timestamps.
- Handle API failures.
- Retry safely.
- Avoid duplicate events.
- Never crash the main application because a provider is unavailable.

---

# 11. Initial Integrations

Implement adapters behind interfaces.

## 11.1 Have I Been Pwned

Use for:

- email breach exposure
- domain breach exposure where authorized
- password exposure through the privacy-preserving API

Store:

```text
source = HIBP
```

Respect:

- API key requirements
- rate limits
- attribution requirements
- terms of use

Do not copy entire provider databases into Mercav.

---

## 11.2 NVD

Use for:

- CVEs
- CVSS information
- affected products
- references
- vulnerability metadata

Normalize into Mercav's vulnerability model.

---

## 11.3 CISA KEV

Use for:

- known exploited vulnerabilities
- prioritization
- exploitation status

Display clearly:

```text
Known Exploited Vulnerability: YES
```

Do not claim that every affected organization is compromised.

---

## 11.4 MISP

Treat MISP as an optional advanced CTI integration.

Use it for:

- indicators
- relationships
- threat events
- feeds
- correlation
- sharing/export where legally and operationally appropriate

Do not make MISP mandatory for the MVP.

---

## 11.5 abuse.ch / defensive feeds

Where permitted, integrate defensive feeds such as malware/URL intelligence.

Use for:

- malicious URLs
- malware indicators
- hashes
- domains
- IPs

Do not distribute malware samples.

---

# 12. Dark-Web / Forum Intelligence

This must be handled as threat intelligence, not as a stolen-data marketplace.

Pwn may represent information reported by public/authorized threat-intelligence sources.

For every event show:

```text
Source
First Seen
Last Seen
Verification Status
Confidence
Evidence Summary
```

Do not:

- mirror stolen databases
- host credential dumps
- host passwords
- host session cookies
- host authentication tokens
- distribute malware
- provide access to compromised accounts
- facilitate unauthorized access

If a source claims a breach, display the claim as a claim until independently corroborated.

Example:

```text
ALLEGED BREACH

Organization:
Example Corp

Claimed records:
2.4M

Status:
UNVERIFIED

Confidence:
31%

Mercav has not independently verified this claim.
```

---

# 13. Risk Engine

Create:

```text
lib/pwn/risk-engine.ts
```

The risk engine must be deterministic, documented and testable.

Suggested dimensions:

```text
Exposure Severity
Data Sensitivity
Recency
Source Confidence
Exploitability
Organization Criticality
Credential Reusability
Infrastructure Exposure
```

Produce:

```text
riskScore: 0-100
riskLevel:
  INFORMATIONAL
  LOW
  MEDIUM
  HIGH
  CRITICAL
```

Example:

```text
Exposure Risk
78 / 100

HIGH
```

Do not present the score as an official cybersecurity standard.

Label it:

> Mercav Exposure Risk Score

Publish methodology in the UI.

---

# 14. Exposure Classification

Differentiate:

### Mention

The entity is merely mentioned.

```text
Risk: Low
```

### Claimed Exposure

A source claims data was leaked.

```text
Verification: Unverified
```

### Corroborated Exposure

Independent evidence supports the claim.

### Confirmed Exposure

The exposure has reliable evidence.

### Confirmed Compromise

Only use this classification where evidence supports actual unauthorized access/compromise.

Do not equate "company name appears in a leak" with "company was hacked."

---

# 15. Threat Graph

Create a correlation graph connecting:

```text
Threat Actor
      ↓
Campaign
      ↓
Breach
      ↓
Organization
      ↓
Domain
      ↓
IP
      ↓
Hash
      ↓
Malware
      ↓
CVE
```

The graph should support:

- filtering
- node details
- source attribution
- confidence
- timestamps
- relationship types

Use a graph visualization library only if it fits the existing dependency strategy.

---

# 16. Threat Actor Profiles

Route:

```text
/pwn/actors/[id]
```

Display:

```text
Alias
Known aliases
Observed campaigns
Reported incidents
Indicators
Associated malware
Associated vulnerabilities
Timeline
Sources
Confidence
```

Do not infer real-world identity from an alias unless supported by reliable evidence.

Do not automatically accuse a named individual of criminal conduct.

Use neutral labels:

```text
Threat Actor
Suspected Actor
Reported Actor
Unknown Actor
```

depending on evidence.

---

# 17. Legal Context

Create a legal-context subsystem.

Route:

```text
/pwn/legal
```

Legal analysis must be informational.

Never output:

```text
"Person X will receive 12 years in prison."
```

Instead:

```text
Jurisdiction:
Spain

Potentially relevant legal provisions:
...

Potential offense categories:
...

Statutory penalty information:
...

Important:
Actual criminal liability and sentencing depend on
facts, evidence, jurisdiction, procedural posture,
applicable law and judicial determination.
```

Support jurisdictions incrementally.

Start with:

```text
Bolivia
Argentina
Brazil
Chile
Peru
Mexico
Spain
United States
```

Each legal reference must contain:

```text
jurisdiction
lawName
article
officialSource
effectiveDate
lastReviewedAt
offenseCategory
penaltyText
notes
```

Use official legal sources whenever possible.

Never generate sentencing predictions.

Never calculate a person's "years in prison" from an unverified threat-intelligence profile.

The system may show a structured legal context for observed conduct, but it must not declare guilt.

---

# 18. Attack Surface Monitoring

Add:

```text
/pwn/organizations
```

An organization can register:

```text
example.com
```

Pwn can monitor authorized assets.

Possible asset types:

```text
Domain
Subdomain
IP
Certificate
Technology
Public service
Vulnerability
Exposure
Phishing domain
```

Important:

Monitoring must be passive/defensive by default.

Do not automatically perform intrusive exploitation.

---

# 19. Organization Dashboard

Example:

```text
ACME CORP

Security Exposure
78 / 100

Assets
127

Open Alerts
8

Critical CVEs
2

Known Breaches
4

Credential Exposures
17

Suspicious Domains
3
```

Sections:

```text
Overview
Assets
Exposure
Vulnerabilities
Threats
Alerts
Timeline
Reports
```

---

# 20. Monitoring

Allow authenticated users to create monitoring targets:

```text
Email
Domain
Organization
IP
Asset
```

Configuration:

```text
New breach
Credential exposure
New CVE
Threat actor mention
Phishing
Malware indicator
Suspicious domain
Organization mention
```

Each monitoring rule needs:

```text
id
userId
target
targetType
eventTypes
enabled
createdAt
lastTriggeredAt
```

---

# 21. Alerts

Create an alert engine.

Alert lifecycle:

```text
DETECTED
→ ENRICHED
→ SCORED
→ CREATED
→ DELIVERED
→ ACKNOWLEDGED
→ RESOLVED
```

Channels:

```text
In-app
Email
Web Push
```

Future:

```text
Discord
Slack
Webhook
SIEM
```

Example:

```text
CRITICAL ALERT

New credential exposure detected

Organization:
ACME Corp

Domain:
acme.com

Detected:
2 minutes ago

Confidence:
High

Risk:
Critical

Recommended actions:
1. Review affected identities
2. Reset exposed credentials
3. Revoke active sessions
4. Verify MFA
5. Review authentication logs
```

---

# 22. Real-Time Architecture

Do not make the browser poll every provider.

Use:

```text
Scheduled ingestion
      ↓
Queue / Worker
      ↓
Database
      ↓
Alert Engine
      ↓
Realtime event
      ↓
Pwn dashboard
```

Use an existing Mercav-compatible realtime mechanism where available.

Possible implementation:

```text
PostgreSQL
+
background worker
+
server-sent events / WebSocket / managed realtime
```

Choose based on the existing deployment architecture.

---

# 23. Job / Worker Architecture

External intelligence ingestion should run outside normal page requests.

Workers should support:

```text
fetch source
normalize
deduplicate
correlate
score
alert
```

Each job must be:

- idempotent
- retryable
- observable
- rate-limited
- timeout-protected

Store job status:

```text
PENDING
RUNNING
SUCCESS
FAILED
RETRYING
```

---

# 24. Database Design

Add Prisma models conceptually equivalent to:

```text
PwnSource
PwnSourceCredential
PwnThreatEvent
PwnBreach
PwnExposure
PwnIndicator
PwnIndicatorRelation
PwnVulnerability
PwnThreatActor
PwnCampaign
PwnOrganization
PwnAsset
PwnMonitoringTarget
PwnAlert
PwnRiskAssessment
PwnLegalReference
PwnReport
PwnIngestionJob
PwnAuditLog
```

Every model must have:

```text
id
createdAt
updatedAt
```

Where relevant add:

```text
sourceId
confidenceScore
verificationStatus
firstSeenAt
lastSeenAt
```

Add indexes for:

```text
email hash
domain
IP
hash
CVE
source
timestamp
organization
risk score
verification status
```

Do not index or store plaintext passwords.

---

# 25. Data Minimization

Security data must be minimized.

Rules:

1. Store only what is required.
2. Hash sensitive search identifiers when possible.
3. Redact personal information in UI.
4. Never store plaintext credentials.
5. Never store authentication tokens from leaks.
6. Do not replicate complete illicit datasets.
7. Define retention periods.
8. Delete expired raw ingestion data.
9. Keep provenance and derived intelligence separately.
10. Log administrative access to sensitive intelligence.

---

# 26. Privacy

Pwn itself must be designed securely.

Implement:

```text
Authentication
Authorization
Rate limiting
Input validation
CSRF protection where applicable
Secure cookies
CSP
Security headers
Audit logs
Encryption at rest where supported
Encryption in transit
Secret management
```

Never expose provider API keys to the client.

All provider calls must execute server-side.

---

# 27. API Security

Public APIs:

```text
/api/pwn/exposure
/api/pwn/breaches
/api/pwn/vulnerabilities
```

must have:

- authentication where required
- rate limits
- request validation
- pagination
- maximum query size
- abuse detection
- structured errors

Internal ingestion APIs must never be publicly callable.

---

# 28. Search Privacy

For sensitive searches:

Do not log:

```text
raw email
raw username
raw password
raw token
```

Use:

```text
request ID
hashed identifier
search type
timestamp
user ID
provider
result category
```

If temporary plaintext processing is unavoidable, keep it in memory and do not persist it.

---

# 29. API Key Management

Never put provider secrets in:

```text
NEXT_PUBLIC_*
```

Use server-side environment variables or a proper secret manager.

Example:

```env
HIBP_API_KEY=
NVD_API_KEY=
MISP_URL=
MISP_API_KEY=
```

Production secrets must not be committed to Git.

---

# 30. Error Handling

Provider failures must never break Pwn.

Example:

```text
HIBP unavailable

Status:
DEGRADED

Last successful sync:
2026-09-22 23:42 UTC

Try again later.
```

Do not show stack traces to users.

Log detailed diagnostics server-side.

---

# 31. Observability

Add:

```text
structured logs
request IDs
job IDs
source IDs
metrics
error tracking
```

Track:

```text
ingestion success rate
ingestion latency
provider errors
API latency
search volume
alert latency
queue depth
database query latency
```

Create an admin health dashboard.

---

# 32. Admin Dashboard

Add:

```text
/pwn/admin
```

Admin-only.

Sections:

```text
System Health
Sources
Ingestion Jobs
Failed Jobs
Threat Events
Alerts
Reports
Legal Data
Audit Logs
```

Source health:

```text
HIBP
● Operational

NVD
● Operational

CISA KEV
● Operational

MISP
● Not configured
```

---

# 33. Audit Logs

Every privileged action should produce an audit event.

Examples:

```text
SOURCE_CREATED
SOURCE_UPDATED
SOURCE_DISABLED
REPORT_GENERATED
SENSITIVE_QUERY
ALERT_ACKNOWLEDGED
ORGANIZATION_UPDATED
LEGAL_REFERENCE_UPDATED
ADMIN_ACCESS
```

Do not put sensitive raw values in audit logs.

---

# 34. Reports

Routes:

```text
/pwn/reports
/pwn/reports/[id]
```

Types:

```text
Executive Report
Exposure Report
Incident Report
Vulnerability Report
Organization Security Report
```

PDF should include:

```text
Mercav Pwn branding
generation timestamp
scope
sources
confidence
findings
risk
recommendations
limitations
```

Every report must state that intelligence may include unverified claims where applicable.

---

# 35. API for Customers

Future public API:

```text
GET /api/v1/pwn/exposure
GET /api/v1/pwn/breaches
GET /api/v1/pwn/vulnerabilities
GET /api/v1/pwn/organizations
GET /api/v1/pwn/alerts
```

Use API keys:

```text
Mercav API Key
```

Support:

```text
rate limit
quota
usage
revocation
rotation
last used
```

Never return raw stolen credentials.

---

# 36. AI Analyst

Implement after the core intelligence engine works.

AI should receive normalized data, not raw stolen dumps.

Input:

```text
incident
sources
indicators
confidence
risk
timeline
organization
vulnerabilities
```

Output:

```text
Executive summary
Evidence summary
Risk explanation
Potential impact
Recommended defensive actions
Uncertainty
```

AI must never:

- invent evidence
- declare guilt
- invent breach confirmation
- invent legal penalties
- claim an actor identity without evidence
- expose secrets

Every AI statement should be grounded in stored intelligence.

---

# 37. Frontend Components

Create reusable components:

```text
<PwnHeader />
<PwnSidebar />
<ExposureSearch />
<RiskScore />
<ConfidenceBadge />
<VerificationBadge />
<SourceBadge />
<ThreatEventCard />
<BreachCard />
<VulnerabilityCard />
<AlertCard />
<ThreatTimeline />
<ThreatGraph />
<IndicatorTable />
<OrganizationOverview />
<ExposureBreakdown />
<SeverityBadge />
<SourceHealth />
<EmptyState />
<ErrorState />
<LoadingState />
```

Avoid duplicating UI.

---

# 38. UX Requirements

Every data-heavy screen needs:

```text
Loading state
Empty state
Error state
Retry state
Pagination
Search
Filters
Sort
Mobile responsive behavior
Keyboard accessibility
```

Do not build desktop-only dashboards.

---

# 39. Accessibility

Target WCAG 2.2 AA where practical.

Ensure:

- keyboard navigation
- focus states
- semantic buttons
- accessible dialogs
- labels for inputs
- readable contrast
- reduced-motion support
- screen-reader-friendly status indicators

Respect:

```css
prefers-reduced-motion
```

---

# 40. SEO

Public pages should have:

```text
metadata
OpenGraph
Twitter/X cards
canonical URLs
structured data where appropriate
```

Do not index private searches.

Do not expose sensitive query strings in public URLs.

---

# 41. Performance

Targets:

```text
Fast initial render
Server-side data fetching where appropriate
Cached threat feeds
Paginated tables
Virtualized large lists
Lazy-loaded graph
Optimized charts
```

Never fetch thousands of events directly into the browser.

---

# 42. Caching

Cache relatively static intelligence:

```text
CVE metadata
CISA KEV
source metadata
vulnerability references
```

Do not cache sensitive user-specific exposure results in shared caches.

Use explicit cache keys and authorization boundaries.

---

# 43. Rate Limiting

Implement separate limits for:

```text
anonymous searches
authenticated searches
API users
monitoring jobs
admin operations
provider connectors
```

Example starting values:

```text
Anonymous:
10 requests / minute

Authenticated:
60 requests / minute

API:
depends on plan
```

Tune after observing production traffic.

---

# 44. Subscription Model

Suggested tiers:

## Free

```text
Limited searches
Basic breach information
Basic CVE intelligence
Basic risk score
```

## Pro

```text
Unlimited/expanded searches
Monitoring
Alerts
Advanced exposure
Reports
```

## Business

```text
Multiple organizations
Team members
API
Advanced monitoring
Reports
Threat intelligence
```

## Enterprise

```text
Custom integrations
MISP
SIEM
Webhooks
High API limits
Dedicated support
```

Do not implement billing before the core security functionality is stable.

---

# 45. Production Environment

Before launch verify:

```text
Production database
HTTPS
Domain
DNS
Secrets
Authentication
Email provider
Background worker
Realtime mechanism
Monitoring
Error tracking
Backups
Database migrations
Rate limits
CSP
Security headers
```

Domain:

```text
pwn.mercav.lat
```

---

# 46. Environment Variables

Use a documented `.env.example`.

Example:

```env
DATABASE_URL=

NEXTAUTH_URL=
NEXTAUTH_SECRET=

HIBP_API_KEY=

NVD_API_KEY=

MISP_URL=
MISP_API_KEY=

PWN_ENCRYPTION_KEY=

EMAIL_PROVIDER_API_KEY=

SENTRY_DSN=
```

Never commit actual secrets.

---

# 47. Security Headers

Configure at minimum where compatible:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Frame-ancestors
```

Review CSP carefully because Mercav may already depend on third-party resources.

---

# 48. Testing Strategy

Required tests:

## Unit

```text
risk engine
confidence engine
normalization
redaction
legal classification
deduplication
permissions
```

## Integration

```text
HIBP connector
NVD connector
CISA connector
MISP connector
database
alert pipeline
monitoring
```

## E2E

```text
login
search exposure
view breach
create monitoring target
receive alert
generate report
admin source management
```

## Security

Test:

```text
SQL injection
XSS
CSRF
IDOR
authorization bypass
rate-limit bypass
API key leakage
secret exposure
unsafe redirects
path traversal
SSRF
```

Do not test against third-party systems without authorization.

---

# 49. Seed Data

Create development-only seed data.

Example:

```text
Demo Organization
Demo Breach
Demo CVE
Demo Threat Actor
Demo Alert
Demo Monitoring Target
```

Never seed realistic stolen credentials.

Clearly mark all demo data:

```text
DEMO
```

---

# 50. Migration Strategy

Do not make destructive Prisma changes in production.

Workflow:

```text
schema change
↓
migration
↓
local test
↓
staging
↓
backup
↓
production migration
↓
verification
```

Never use `prisma db push` as the production deployment strategy.

Use proper migrations.

---

# 51. Deployment

Recommended deployment topology:

```text
Vercel / Next.js
        │
        ├── Web application
        │
        └── API
             │
             ↓
        PostgreSQL
             │
             ↓
      Worker / Scheduler
             │
      ┌──────┴───────┐
      ↓              ↓
Threat Sources    Alert Engine
```

If Vercel is used, do not assume long-running background work can run reliably inside standard serverless requests.

Use an appropriate queue/worker/scheduler provider for ingestion.

---

# 52. CI/CD

Pipeline:

```text
Pull Request
   ↓
Lint
   ↓
Typecheck
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Security Checks
   ↓
Preview
   ↓
Manual Approval
   ↓
Production
```

Production deployment must fail if:

```text
TypeScript errors
Lint errors
Failed tests
Migration errors
Build errors
```

---

# 53. Data Retention

Define retention policies before production.

Suggested categories:

```text
Raw ingestion:
short retention

Normalized intelligence:
longer retention

Audit logs:
long retention

User search history:
user-configurable / privacy-aware

Reports:
until deleted or policy expiration
```

Do not retain unnecessary raw sensitive information.

---

# 54. Compliance / Legal

Before production, review:

```text
Privacy policy
Terms of service
Acceptable use policy
Data processing
Provider terms
Copyright/licensing
Regional privacy laws
Data retention
User deletion
Security incident response
```

Because Mercav targets Latin America, do not assume one country's privacy rules apply everywhere.

---

# 55. Abuse Prevention

Pwn must actively prevent misuse.

Block or restrict:

```text
bulk credential enumeration
credential harvesting
password discovery
session token searches
account takeover workflows
unauthorized asset scanning
malware distribution
raw dump distribution
```

Implement:

```text
rate limits
query limits
abuse detection
account restrictions
audit logging
```

A user should not be able to use Pwn as a credential-validation service.

---

# 56. Source Attribution

Every external intelligence record must retain:

```text
source
source URL when appropriate
source timestamp
ingestion timestamp
license/terms metadata where relevant
```

UI:

```text
Source:
NVD

Last updated:
...

Confidence:
High
```

Never imply that Mercav itself discovered information if it came from a third party.

---

# 57. MVP Scope

Do not attempt everything at once.

MVP must include:

```text
1. Pwn dashboard
2. Exposure search
3. HIBP integration
4. Pwned Password privacy-preserving lookup
5. NVD integration
6. CISA KEV integration
7. Breach model
8. Risk engine
9. Confidence engine
10. Source attribution
11. Monitoring targets
12. Alerts
13. Organization dashboard
14. Basic reports
15. Admin source health
16. Audit logging
17. Rate limiting
18. Redaction
19. Security headers
20. Production tests
```

Do NOT put these in MVP unless the core is already stable:

```text
AI analyst
Threat graph
MISP
Advanced actor intelligence
Legal engine
SIEM integrations
Enterprise API
```

---

# 58. Phase 2

After MVP:

```text
Threat Graph
MISP
abuse.ch
Phishing Intelligence
Malware Intelligence
Advanced monitoring
Webhooks
Discord/Slack
API keys
Advanced reports
AI Analyst
```

---

# 59. Phase 3

Enterprise:

```text
SIEM integrations
STIX/TAXII
MISP bidirectional integration
Team management
SSO
SCIM
Advanced RBAC
Custom feeds
Custom detection rules
Enterprise API
Dedicated workspaces
```

---

# 60. Recommended Risk Dashboard

Main Pwn dashboard:

```text
┌─────────────────────────────────────────────┐
│ MERCAV PWN                                  │
│ Cyber Intelligence & Exposure Monitoring    │
├─────────────────────────────────────────────┤
│                                             │
│ [ Search email / domain / IP / CVE ... ]    │
│                                             │
├──────────┬──────────┬──────────┬────────────┤
│ Exposure │ Breaches │ Alerts   │ Critical   │
│   78     │   23     │    8     │     4      │
├──────────┴──────────┴──────────┴────────────┤
│                                             │
│ LIVE THREAT INTELLIGENCE                    │
│                                             │
│ ● Credential exposure       2m ago          │
│ ● Critical CVE              8m ago          │
│ ● Suspicious domain         13m ago         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ EXPOSURE OVERVIEW                           │
│                                             │
│ Identity        ████████                    │
│ Credentials     ██████████                  │
│ Infrastructure ██████                      │
│ Phishing        █████                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 61. Definition of Done

Pwn is not production-ready until:

## Functionality

- [ ] Exposure search works.
- [ ] Breach results are normalized.
- [ ] Sources are attributed.
- [ ] Confidence is calculated.
- [ ] Risk is calculated.
- [ ] Monitoring works.
- [ ] Alerts work.
- [ ] CVE data works.
- [ ] KEV data works.
- [ ] Reports work.
- [ ] Admin dashboard works.

## Security

- [ ] No plaintext passwords stored.
- [ ] No secrets exposed client-side.
- [ ] Rate limiting enabled.
- [ ] Authorization tested.
- [ ] Audit logging enabled.
- [ ] Security headers configured.
- [ ] Input validation implemented.
- [ ] Sensitive data redacted.
- [ ] Provider API keys protected.
- [ ] SSRF protections reviewed.

## Reliability

- [ ] External provider failures handled.
- [ ] Jobs retry safely.
- [ ] Jobs are idempotent.
- [ ] Database indexes verified.
- [ ] Backups configured.
- [ ] Monitoring configured.
- [ ] Error tracking configured.

## Legal / data governance

- [ ] Provider terms reviewed.
- [ ] Privacy policy updated.
- [ ] Retention policy documented.
- [ ] Acceptable use policy updated.
- [ ] Raw illicit datasets are not replicated.
- [ ] Unverified claims are clearly labeled.
- [ ] Legal information is presented as informational context.

## UX

- [ ] Responsive.
- [ ] Accessible.
- [ ] Loading states.
- [ ] Empty states.
- [ ] Error states.
- [ ] Reduced motion support.
- [ ] Mobile navigation.
- [ ] Consistent Mercav visual identity.

---

# 62. Agent Execution Rules

The implementation agent must follow these rules:

1. Inspect the existing repository before changing architecture.
2. Reuse existing Mercav components whenever possible.
3. Do not replace the existing design system unnecessarily.
4. Do not rewrite unrelated modules.
5. Do not introduce dependencies without justification.
6. Prefer server-side processing for sensitive data.
7. Never expose provider API keys to the client.
8. Never store plaintext passwords.
9. Never store or distribute raw stolen credential dumps.
10. Do not build credential-validation or account-takeover functionality.
11. Treat third-party breach claims as unverified until corroborated.
12. Keep source attribution for every external intelligence record.
13. Make risk/confidence calculations deterministic and testable.
14. Keep all provider integrations behind interfaces.
15. Make ingestion jobs idempotent.
16. Add tests with every major subsystem.
17. Do not break existing Mercav functionality.
18. Run lint, typecheck, tests and production build before declaring completion.
19. Use migrations for production database changes.
20. Do not mark a task complete if it only works in development.
21. Do not invent external API behavior; verify provider documentation before implementing connectors.
22. Do not perform unauthorized scanning or exploitation.
23. Keep legal analysis informational and jurisdiction-specific.
24. Prefer official sources for legal references.
25. Document every new environment variable.
26. Document every new database model.
27. Document every external provider.
28. Document every retention rule.
29. Add an explicit feature flag for unfinished integrations.
30. If an external integration cannot be implemented reliably, ship a graceful disabled state rather than a fake implementation.

---

# 63. Implementation Order

Execute in this exact order unless the existing repository requires a safe variation:

```text
STEP 1
Inspect repository and existing architecture.

STEP 2
Inspect current authentication, database, UI system and deployment setup.

STEP 3
Create Pwn domain structure.

STEP 4
Create Prisma models and migrations.

STEP 5
Create shared Pwn UI components.

STEP 6
Implement Pwn dashboard.

STEP 7
Implement source abstraction.

STEP 8
Implement HIBP connector.

STEP 9
Implement NVD connector.

STEP 10
Implement CISA KEV connector.

STEP 11
Implement exposure search.

STEP 12
Implement redaction/privacy layer.

STEP 13
Implement confidence engine.

STEP 14
Implement risk engine.

STEP 15
Implement monitoring.

STEP 16
Implement alert engine.

STEP 17
Implement organization dashboard.

STEP 18
Implement admin source health.

STEP 19
Implement reports.

STEP 20
Implement security controls.

STEP 21
Add tests.

STEP 22
Run staging deployment.

STEP 23
Perform security review.

STEP 24
Perform production migration.

STEP 25
Deploy pwn.mercav.lat.

STEP 26
Verify production health.

STEP 27
Only then begin Phase 2.
```

---

# 64. Final Product Principle

Mercav Pwn should not compete by having the biggest collection of stolen data.

It should compete by turning fragmented security intelligence into:

```text
DATA
 ↓
CONTEXT
 ↓
CONFIDENCE
 ↓
RISK
 ↓
ACTION
```

The final user experience should answer five questions:

```text
What happened?

How reliable is the information?

Does it affect me?

How serious is it?

What should I do next?
```

That is the core product definition of Mercav Pwn.
<! -->
<!-- creado por pato dev y askforvini -->
