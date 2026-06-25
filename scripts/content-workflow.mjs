export const meta = {
  name: 'devmaster-content',
  description: 'Author deep senior-level topic JSON for DevMaster Hub (one agent per topic, writes files directly)',
  phases: [
    { title: 'Topics' },
    { title: 'Aggregate' },
  ],
}

const DATA = '/home/user/devmaster-hub/src/assets/data'

// Shared authoring contract every topic agent must follow.
const RULES = `
You are a Principal Engineer and senior technical interviewer authoring premium learning
content for "DevMaster Hub", an interview-prep + learning SaaS. Write REAL senior-level
material — no placeholders, no "TODO", no lorem ipsum, no vague hand-waving. Every code
sample must be realistic and correct. Every answer must be the kind a staff engineer would
give in an interview.

OUTPUT: Use the Write tool to write a SINGLE JSON file to the exact path given below.
Then return ONLY a one-line JSON summary: {"id":"<id>","sections":N,"questions":N,"challenges":N,"diagrams":N}.
Do not print the file contents in your final message.

The JSON file MUST be valid JSON (double quotes, no trailing commas, no comments) and match
EXACTLY this shape:

{
  "id": string,                      // the topic id given to you
  "title": string,
  "category": string,                // the category given to you
  "subcategory": string,
  "difficulty": "junior"|"mid"|"senior",
  "tags": string[],                  // 4-8 lowercase tags
  "description": string,             // one compelling sentence
  "estReadMinutes": number,          // realistic 15-35
  "sections": [
    {
      "id": string,                  // kebab-case unique within file
      "heading": string,
      "kind": "intro"|"why"|"concept"|"example"|"mistake"|"bestpractice"|"note",
      "blocks": [
        // each block has "type" plus the fields for that type:
        {"type":"paragraph","text": string},
        {"type":"heading","text": string},                       // subheading inside a section
        {"type":"list","items": string[]},
        {"type":"code","language": string,"code": string},       // language e.g. typescript,java,bash,yaml,json,sql,html
        {"type":"callout","variant":"info"|"warning"|"danger"|"success","text": string},
        {"type":"table","headers": string[],"rows": string[][]}
      ]
    }
  ],
  "diagrams": [
    {"id": string,"title": string,"type":"mermaid"|"ascii","content": string}
  ],
  "questions": [
    {"id": string,"question": string,"answer": string,"difficulty":"junior"|"mid"|"senior",
     "category": string,"tricky": boolean,"tags": string[],"followUps": string[]}
  ],
  "challenges": [
    {"id": string,"title": string,"difficulty":"junior"|"mid"|"senior","category": string,
     "prompt": string,"hints": string[],"solutionCode": string,"solutionLanguage": string,
     "explanation": string,"relatedTopic": string}
  ],
  "references": [{"label": string,"url": string}]
}

MANDATORY COVERAGE — your sections + diagrams + questions + challenges together MUST cover all
of these 11 elements (this is the product's content contract):
 1. Introduction (kind:"intro")
 2. Why it matters (kind:"why")
 3. Core concepts (one or more kind:"concept" sections — this is the bulk)
 4. Real production examples (kind:"example", with real code and a realistic scenario/incident)
 5. Architecture diagrams (the "diagrams" array)
 6. Common mistakes / production incidents (kind:"mistake")
 7. Interview questions (the "questions" array, tricky:false)
 8. Tricky questions (questions with tricky:true)
 9. Coding exercises (the "challenges" array prompts + hints)
10. Solutions (challenges' solutionCode + explanation)
11. Best practices (kind:"bestpractice")

MINIMUMS (do not go below): >= 8 sections, >= 2 diagrams, >= 10 questions of which >= 3 have
tricky:true, >= 2 challenges with full working solutionCode and a thorough explanation.

DIAGRAMS: prefer "mermaid" for architecture/flow/sequence (use valid mermaid syntax:
flowchart TD / sequenceDiagram / graph LR — keep node labels short, no parentheses inside
labels, escape nothing fancy). Use "ascii" for pipeline/layer diagrams that the brief shows
as ascii (CI/CD pipelines, hexagonal layers, ArgoCD git->cluster). ASCII diagrams use plain
box-drawing with + - | and arrows.

Make questions genuinely senior and varied across junior/mid/senior. Tricky questions should
expose subtle gotchas (proxies, batching, race conditions, memory, consistency, footguns).
Keep code blocks focused (10-40 lines) and idiomatic.
`

// Each topic: id, title, category, subcategory, difficulty, focus (spec-derived must-cover points)
const TOPICS = [
  // ---------------- Frontend ----------------
  { id:'angular18', title:'Angular 18', category:'Frontend', subcategory:'Framework', difficulty:'senior',
    focus:`Angular fundamentals: components, templates, directives, pipes, dependency injection, services.
Angular 18 specifics: signals, signal inputs (input()), signal outputs (output()), model(), computed, effect,
new control flow @if / @for (with track) / @switch, deferrable views @defer. Signals vs RxJS (when each).
Advanced: change detection, Zone.js & zoneless, OnPush, lifecycle hooks, standalone architecture, lazy loading,
route guards, HTTP interceptors. Interview: "Why does OnPush improve performance?". TRICKY: what happens with
counter.set(counter()+1); counter.set(counter()+1) twice in a row — explain signal glitch-free batching and that
effects run once. Challenges: debounced search (with toSignal/rxjs), infinite scroll, simple signal store.` },
  { id:'typescript', title:'TypeScript', category:'Frontend', subcategory:'Language', difficulty:'senior',
    focus:`Types vs interfaces, structural typing, generics & constraints, utility types (Partial, Pick, Omit,
Record, ReturnType, Awaited), conditional & mapped types, template literal types, discriminated unions, decorators,
narrowing, async programming (Promises, async/await). Interview: difference between interface and type. TRICKY:
unknown vs any vs never; why "as" is dangerous; declaration merging. Challenge: implement a generic ApiResponse<T>
wrapper + a typesafe deepReadonly mapped type.` },
  { id:'javascript', title:'JavaScript', category:'Frontend', subcategory:'Language', difficulty:'senior',
    focus:`Event loop, microtasks vs macrotasks, closures, prototypes & prototypal inheritance, this binding,
hoisting, scope, var/let/const, the module system, promises, async/await, generators, debounce/throttle,
memory leaks, deep vs shallow copy. TRICKY: classic loop closure with var; Promise ordering with setTimeout vs
Promise.resolve; equality coercion. Challenge: implement debounce, a promise pool / limit concurrency, deep clone.` },

  // ---------------- Backend ----------------
  { id:'spring-boot', title:'Spring Boot', category:'Backend', subcategory:'Java Framework', difficulty:'senior',
    focus:`Spring core: IoC, dependency injection, beans, ApplicationContext, bean scopes & lifecycle. Spring Boot:
auto-configuration, starters, profiles, Actuator, externalized config. REST: controllers, DTOs, bean validation,
exception handling (@ControllerAdvice). Data: Hibernate/JPA, transactions, lazy loading & N+1, fetch strategies.
Security: JWT, OAuth2 basics. Interview: why constructor injection over field injection. TRICKY: why does a
@Transactional method calling this.otherMethod() not start a new transaction — explain Spring AOP proxies (self
invocation bypasses the proxy), and @Transactional on private/internal methods. Challenge: fix the broken
transaction + design a clean exception-handling layer.` },
  { id:'quarkus', title:'Quarkus', category:'Backend', subcategory:'Java Framework', difficulty:'senior',
    focus:`Native compilation with GraalVM, build-time vs runtime processing, fast startup & low memory, CDI (Arc),
RESTEasy Reactive, Hibernate ORM with Panache (active record + repository), reactive programming (Mutiny Uni/Multi),
dev mode / live reload, dev services. Interview: Spring Boot vs Quarkus tradeoffs; when to choose Quarkus
(serverless, k8s density, fast cold start). TRICKY: reflection & native image pitfalls (@RegisterForReflection).` },
  { id:'rest-apis', title:'REST APIs', category:'Backend', subcategory:'API Design', difficulty:'senior',
    focus:`REST constraints, resource modeling, proper HTTP verbs & status codes, idempotency, pagination,
filtering, versioning strategies, HATEOAS, content negotiation, error responses (RFC 7807 problem+json),
rate limiting, caching (ETag, Cache-Control), API security. Richardson Maturity Model. Interview: idempotency of
PUT vs POST vs PATCH; how to design pagination at scale (cursor vs offset). TRICKY: is PATCH idempotent?
Challenge: design a well-versioned, idempotent payment-create endpoint with an idempotency key.` },
  { id:'security', title:'Application Security', category:'Backend', subcategory:'AuthN/AuthZ', difficulty:'senior',
    focus:`Authentication vs authorization, sessions vs JWT, JWT structure/signing/validation/expiry/refresh tokens,
OAuth2 grant types (auth code + PKCE, client credentials), OpenID Connect, RBAC vs ABAC, password hashing (bcrypt/argon2),
CSRF, CORS, secure cookie flags. Interview: stateless JWT tradeoffs and revocation. TRICKY: why storing JWT in
localStorage is risky (XSS) vs httpOnly cookie (CSRF) — the tradeoff. Challenge: implement refresh-token rotation.` },
  { id:'caching-redis', title:'Caching & Redis', category:'Backend', subcategory:'Performance', difficulty:'senior',
    focus:`Cache patterns (cache-aside, read-through, write-through, write-behind), TTL & eviction (LRU/LFU),
Redis data structures (string, hash, list, set, sorted set, stream), distributed locks (Redlock caveats),
cache stampede / thundering herd, hot keys, cache invalidation. Interview: cache-aside vs write-through. TRICKY:
the two hard problems — cache invalidation & naming; how to prevent stampede (locks, jitter, early recompute).
Challenge: implement cache-aside with stampede protection.` },
  { id:'graphql', title:'GraphQL', category:'Backend', subcategory:'API Design', difficulty:'mid',
    focus:`Schema, types, queries, mutations, subscriptions, resolvers, the N+1 problem & DataLoader batching,
over/under-fetching vs REST, pagination (Relay connections), error handling, schema stitching/federation, caching
challenges. Interview: GraphQL vs REST tradeoffs. TRICKY: why GraphQL makes caching & rate limiting harder; the
N+1 resolver explosion. Challenge: implement a DataLoader to fix N+1.` },
  { id:'grpc', title:'gRPC & Protobuf', category:'Backend', subcategory:'RPC', difficulty:'mid',
    focus:`Protocol Buffers schema, HTTP/2 multiplexing, the 4 RPC types (unary, server-stream, client-stream,
bidi), code generation, deadlines/cancellation, interceptors, backward/forward compatibility (field numbers),
gRPC vs REST vs GraphQL. Interview: when gRPC over REST (internal low-latency, streaming). TRICKY: never reuse or
renumber proto field tags; required-field pitfalls. Challenge: design a streaming price-feed service.` },

  // ---------------- Architecture ----------------
  { id:'solid', title:'SOLID Principles', category:'Architecture', subcategory:'Design Principles', difficulty:'senior',
    focus:`All five with bad->good code in Java. S: UserService doing db+email+payment -> split responsibilities.
O: add a payment provider without modifying existing code (strategy/polymorphism). L: Rectangle/Square violation
and how it breaks substitutability. I: split a fat interface into role interfaces. D: high-level modules depend on
abstractions, inject the abstraction. Interview: "which SOLID principle is violated?" with code snippets the reader
must diagnose. TRICKY: how SRP relates to "reasons to change" not "do one thing".` },
  { id:'design-patterns', title:'Design Patterns (GoF)', category:'Architecture', subcategory:'Patterns', difficulty:'senior',
    focus:`Cover creational (Singleton, Factory Method, Abstract Factory, Builder, Prototype), structural (Adapter,
Decorator, Facade, Proxy, Composite), behavioral (Strategy, Observer, Command, Chain of Responsibility, Template
Method). For EACH pattern give: problem, solution, when to use, when NOT to use, a Java example, and an interview
question. Flagship interview: "design a notification system" -> Strategy (per-channel) + Observer. TRICKY: why
Singleton is often an anti-pattern (global state, testing); double-checked locking. Use multiple concept sections.` },
  { id:'clean-architecture', title:'Clean Architecture', category:'Architecture', subcategory:'Architecture', difficulty:'senior',
    focus:`Layers: Entities, Use Cases, Interface Adapters, Frameworks & Drivers. The Dependency Rule (source code
dependencies point inward only). Screaming architecture, boundaries, DTOs at boundaries. Interview: difference
between Clean Architecture and Hexagonal Architecture (concentric layers vs ports/adapters — same goal, different
emphasis). TRICKY: where do frameworks/DB belong and why the domain must not import them. Challenge: map a CRUD
Spring app onto the four layers.` },
  { id:'hexagonal-architecture', title:'Hexagonal Architecture', category:'Architecture', subcategory:'Architecture', difficulty:'senior',
    focus:`Ports & Adapters. Inside: domain model + use cases (application services). Ports: inbound (driving) and
outbound (driven) interfaces. Outside: REST adapter, DB/JPA adapter, Kafka adapter — all implement ports. Why
business logic must not depend on frameworks (testability, replaceability). ASCII layered diagram Domain ->
Application -> Ports -> Adapters. Interview: why hexagonal is useful; where should validation happen (domain
invariants in domain, input validation at inbound adapter); where should transactions live (application/use-case
layer). Challenge: refactor a fat Spring @Service into ports & adapters.` },
  { id:'ddd', title:'Domain-Driven Design', category:'Architecture', subcategory:'Modeling', difficulty:'senior',
    focus:`Entities, value objects, aggregates & aggregate roots (consistency boundaries), repositories, domain
events, bounded contexts, ubiquitous language, context mapping, anti-corruption layer. Strategic vs tactical DDD.
Interview: when SHOULD you use DDD (complex core domain) and when not (simple CRUD). TRICKY: aggregate boundaries
& transactional consistency (one aggregate per transaction; eventual consistency between aggregates). Challenge:
design an Order aggregate (Order root, OrderLine, Money VO, invariants) for order management.` },
  { id:'microservices', title:'Microservices', category:'Architecture', subcategory:'Distributed', difficulty:'senior',
    focus:`Service boundaries (by business capability), API gateway, service discovery, sync vs async communication,
event-driven choreography vs orchestration, the Saga pattern (orchestration vs choreography, compensating actions),
distributed transactions & 2PC pitfalls, idempotency, observability. Interview: when NOT to use microservices
(small team, unclear domain, premature). TRICKY: how microservices become a distributed monolith (shared DB,
chatty sync calls, lockstep deploys). Diagrams for gateway + saga. Challenge: design a saga for order+payment+stock.` },
  { id:'system-design', title:'System Design', category:'Architecture', subcategory:'Interview', difficulty:'senior',
    focus:`Full interview prep. For EACH design problem give Requirements (functional + non-functional), high-level
Architecture, Database/data model, Scaling strategy, Caching, and Failure handling. Cover: URL shortener (base62,
hashing, collisions), chat system (websockets, fan-out, presence), payment system (idempotency, ledger, exactly
once, double-spend), food delivery (geo, matching, dispatch), notification platform (multi-channel, queue, rate
limit, retries/DLQ). Include capacity-estimation tips, CAP, consistent hashing, load balancing. Use one concept
section per problem + mermaid diagrams.` },

  // ---------------- Computer Science ----------------
  { id:'data-structures-algorithms', title:'Data Structures & Algorithms', category:'Computer Science', subcategory:'Fundamentals', difficulty:'mid',
    focus:`Big-O time/space, arrays, hashmaps/sets, linked lists, stacks, queues, heaps/priority queues, trees
(BST, balanced, tries), graphs (BFS/DFS, Dijkstra, topo sort), sorting, two pointers, sliding window, binary search,
recursion & dynamic programming, common patterns. Interview: complexity of hashmap ops & worst case; when DP.
TRICKY: amortized analysis (dynamic array push), why average vs worst-case hashmap. Challenges: two-sum (hashmap),
LRU cache (hashmap+doubly linked list), detect cycle in linked list (Floyd).` },
  { id:'databases-sql', title:'Databases & SQL', category:'Computer Science', subcategory:'Data', difficulty:'senior',
    focus:`Relational modeling, normalization, indexes (B-tree, covering, composite, leftmost prefix), query
planning/EXPLAIN, joins, transactions & ACID, isolation levels (read committed, repeatable read, serializable) and
the anomalies (dirty/non-repeatable/phantom reads), locking & MVCC, deadlocks, the N+1 query problem, SQL vs NoSQL,
sharding & replication. Interview: pick an index for a query; isolation level tradeoffs. TRICKY: why an index can be
ignored (low selectivity, function on column), and lost-update under read-committed. Challenge: optimize a slow
query + design indexes.` },
  { id:'java-concurrency', title:'Java Concurrency', category:'Computer Science', subcategory:'Concurrency', difficulty:'senior',
    focus:`Threads, the Java Memory Model (happens-before, visibility), volatile, synchronized, locks (ReentrantLock,
ReadWriteLock), atomics & CAS, ExecutorService & thread pools, CompletableFuture, ConcurrentHashMap, deadlock/
livelock/starvation, virtual threads (Project Loom). Interview: volatile vs synchronized; thread pool sizing.
TRICKY: double-checked locking without volatile is broken; check-then-act races; why HashMap can infinite-loop under
concurrency. Challenge: implement a thread-safe bounded blocking queue.` },

  // ---------------- Messaging ----------------
  { id:'kafka', title:'Apache Kafka', category:'Messaging', subcategory:'Streaming', difficulty:'senior',
    focus:`Architecture: producer, broker, topic, partition, consumer group, offsets, the commit log. Concepts:
partitioning & ordering guarantees (per-partition), replication & ISR, leader/follower, retention (time/size/compaction),
acks (0/1/all), consumer rebalancing, delivery semantics at-most/at-least/exactly-once, idempotent producer &
transactions, consumer lag. Interview: why Kafka scales (partitioning + sequential disk IO + zero copy + consumer
groups). Problem: duplicate messages on retry -> Solution: idempotency keys + idempotent producer + EOS. TRICKY:
ordering is only per-partition; rebalance storms; poison-pill messages. Challenge: design an idempotent consumer.` },

  // ---------------- DevOps ----------------
  { id:'cicd', title:'CI/CD', category:'DevOps', subcategory:'Delivery', difficulty:'mid',
    focus:`Define CI vs Continuous Delivery vs Continuous Deployment clearly. Pipeline stages ascii diagram:
Commit -> Build -> Test -> Security scan -> Docker build -> Deploy. Trunk-based vs gitflow, build caching, artifact
promotion across envs, blue/green & canary deploys, rollback, secrets in pipelines, DORA metrics. Interview:
difference between delivery and deployment. TRICKY: why "works on CI but not prod" (env parity), flaky tests
blocking the pipeline. Challenge: design a multi-stage pipeline with quality gates.` },
  { id:'docker', title:'Docker', category:'DevOps', subcategory:'Containers', difficulty:'mid',
    focus:`Images vs containers, the layered filesystem & union FS, Dockerfile, build cache & layer ordering,
multi-stage builds, volumes (named/bind/tmpfs), networks (bridge/host/none), ENTRYPOINT vs CMD, COPY vs ADD,
.dockerignore, distroless/slim base images, image size optimization, running as non-root. Interview: COPY vs ADD;
why order matters for cache. Problem: optimize a 1.2GB image down with multi-stage + slim base + layer caching.
TRICKY: why each RUN creates a layer and how to minimize; PID 1 / signal handling / zombie reaping.` },
  { id:'kubernetes', title:'Kubernetes', category:'DevOps', subcategory:'Orchestration', difficulty:'senior',
    focus:`Control plane: API server, scheduler, controller manager, etcd. Worker: kubelet, kube-proxy, pods,
container runtime. Objects: Pod, ReplicaSet, Deployment (rolling update), Service (ClusterIP/NodePort/LoadBalancer),
Ingress, ConfigMap, Secret, HPA, liveness/readiness/startup probes, requests/limits, namespaces, RBAC. Interview:
why are containers restarted (failed liveness probe, OOMKilled, crash) — explain CrashLoopBackOff & OOMKilled.
TRICKY: readiness vs liveness misuse causing cascading restarts; resource limits & CPU throttling. Diagram the
control plane. Challenge: write a production Deployment + Service + HPA.` },
  { id:'helm', title:'Helm', category:'DevOps', subcategory:'K8s Packaging', difficulty:'mid',
    focus:`Charts, templates (Go templating), values.yaml & value overrides, releases & revisions, helm upgrade/
rollback, chart dependencies, _helpers.tpl, hooks, chart repositories, library vs application charts. Interview:
Helm vs Kustomize. Problem: create a production-grade Helm chart (templated Deployment/Service/Ingress/HPA, env
overrides, resource limits, probes). TRICKY: helm template rendering gotchas (whitespace, quoting, nil values).` },
  { id:'kustomize', title:'Kustomize', category:'DevOps', subcategory:'K8s Packaging', difficulty:'mid',
    focus:`Base + overlays model, kustomization.yaml, patches (strategic merge & JSON6902), name prefixes/suffixes,
common labels, configMap/secret generators, overlays for dev/staging/production. Helm vs Kustomize (templating vs
overlay/patching, no templating language). Example base + three overlays. TRICKY: patch target matching; generator
hash suffixes triggering rollouts.` },
  { id:'argocd', title:'ArgoCD & GitOps', category:'DevOps', subcategory:'GitOps', difficulty:'mid',
    focus:`Explain GitOps (git as single source of truth, declarative, pull-based reconciliation). ASCII diagram
Git -> ArgoCD -> Kubernetes. Application CRD, sync & self-heal, drift detection, sync waves & hooks, app-of-apps,
rollback by git revert. Interview: why GitOps (auditability, reproducibility, easy rollback, no kubectl access in
prod). TRICKY: secret management in GitOps (sealed secrets / external secrets); auto-sync + manual change drift.` },
  { id:'observability', title:'Observability', category:'DevOps', subcategory:'Monitoring', difficulty:'mid',
    focus:`The three pillars: metrics, logs, traces. RED & USE methods, SLI/SLO/SLA & error budgets, Prometheus &
PromQL, structured logging, distributed tracing (OpenTelemetry, trace/span/context propagation), cardinality
explosions, alerting on symptoms not causes. Interview: monitoring vs observability. TRICKY: high-cardinality
labels blowing up Prometheus; alert fatigue. Challenge: define SLOs + an error budget policy for an API.` },

  // ---------------- Cloud ----------------
  { id:'aws-ec2', title:'AWS EC2', category:'Cloud', subcategory:'Compute', difficulty:'mid',
    focus:`Instances & instance families, AMIs, user data, security groups vs NACLs, key pairs, EBS volumes vs
instance store, Elastic IPs, placement groups, auto scaling groups + launch templates, pricing (on-demand/reserved/
spot/savings plans). Interview: EC2 vs Lambda (when each). TRICKY: security group (stateful) vs NACL (stateless)
differences; spot interruption handling. Challenge: design an auto-scaling, multi-AZ web tier.` },
  { id:'aws-ecs', title:'AWS ECS', category:'Cloud', subcategory:'Containers', difficulty:'mid',
    focus:`Task definitions, tasks, services, clusters, EC2 launch type vs Fargate (serverless), task networking
(awsvpc), service auto scaling, ALB integration & target groups, task roles vs execution roles, secrets injection.
Interview: ECS vs EKS (simplicity/AWS-native vs k8s portability). TRICKY: task role vs execution role confusion;
Fargate cold-ish starts & pricing. Challenge: deploy a containerized API on Fargate behind an ALB.` },
  { id:'aws-eks', title:'AWS EKS', category:'Cloud', subcategory:'Kubernetes', difficulty:'senior',
    focus:`Managed Kubernetes control plane, node groups (managed/self-managed) vs Fargate profiles, IRSA (IAM Roles
for Service Accounts), AWS Load Balancer Controller, VPC CNI & pod networking, cluster autoscaler vs Karpenter,
add-ons. Interview: ECS vs EKS; when EKS (k8s ecosystem, portability, multi-cloud). TRICKY: IRSA setup &
OIDC provider; pod IP exhaustion with VPC CNI. Challenge: wire IRSA so a pod can read S3 with least privilege.` },
  { id:'aws-lambda', title:'AWS Lambda', category:'Cloud', subcategory:'Serverless', difficulty:'mid',
    focus:`Serverless model, event sources (API Gateway, S3, SQS, EventBridge), execution model & concurrency,
cold starts (causes & mitigations: provisioned concurrency, smaller packages, SnapStart), memory/CPU coupling,
timeouts, /tmp, layers, idempotency for retried async events, VPC-attached lambda ENI cold start. Interview: EC2 vs
Lambda; Lambda limits. TRICKY: cold start anatomy; duplicate invocations (at-least-once from SQS/async) -> need
idempotency. Challenge: build an idempotent S3-triggered image processor.` },
  { id:'aws-s3', title:'AWS S3', category:'Cloud', subcategory:'Storage', difficulty:'mid',
    focus:`Buckets, objects, keys, prefixes, storage classes (Standard/IA/Glacier/Intelligent-Tiering), durability
vs availability, versioning, lifecycle policies, strong read-after-write consistency, presigned URLs, encryption
(SSE-S3/SSE-KMS), bucket policies vs IAM vs ACLs, static hosting, multipart upload, event notifications, Transfer
Acceleration. Interview: how to secure a bucket; presigned URL use. TRICKY: public bucket misconfig data leaks;
eventual vs strong consistency (now strong). Challenge: design secure direct-to-S3 uploads with presigned URLs.` },
  { id:'aws-iam', title:'AWS IAM', category:'Cloud', subcategory:'Security', difficulty:'senior',
    focus:`Users, groups, roles, policies (identity-based vs resource-based), policy evaluation logic (explicit deny
wins, default deny), least privilege, assume-role & STS, trust policies, permission boundaries, SCPs (Organizations),
IRSA, condition keys, access keys vs roles. Interview: role vs user; how policy evaluation resolves allow/deny.
TRICKY: explicit deny always wins; confused-deputy & the role trust policy; wildcard policy dangers. Challenge:
write a least-privilege policy for an app that reads one S3 prefix and writes one DynamoDB table.` },

  // ---------------- Engineering ----------------
  { id:'git', title:'Git', category:'Engineering', subcategory:'Version Control', difficulty:'mid',
    focus:`The object model (blobs, trees, commits, refs), staging area, branches as pointers, merge vs rebase,
fast-forward, interactive rebase, cherry-pick, reset (soft/mixed/hard) vs revert, reflog recovery, stash, bisect,
resolving conflicts, trunk-based vs gitflow. Interview: merge vs rebase tradeoffs. TRICKY: reset --hard data loss
& reflog recovery; rebasing a shared/public branch (rewriting published history). Challenge: recover a "lost"
commit after a bad reset using reflog.` },
  { id:'testing-tdd', title:'Testing & TDD', category:'Engineering', subcategory:'Quality', difficulty:'mid',
    focus:`Test pyramid (unit/integration/e2e), TDD red-green-refactor, FIRST principles, mocks vs stubs vs fakes
vs spies, test doubles, arrange-act-assert, property-based testing, contract testing, flaky tests, coverage as a
guide not a goal, testcontainers for integration. Interview: mock vs stub; what to unit vs integration test.
TRICKY: over-mocking couples tests to implementation; testing private methods. Challenge: TDD a small pure function
(e.g. money rounding) red-green-refactor with examples.` },
  { id:'web-security-owasp', title:'Web Security (OWASP)', category:'Engineering', subcategory:'Security', difficulty:'senior',
    focus:`OWASP Top 10: broken access control, cryptographic failures, injection (SQLi, XSS, command), insecure
design, security misconfiguration, vulnerable components, auth failures, integrity failures, logging failures, SSRF.
Defenses: parameterized queries, output encoding/CSP, principle of least privilege, secure headers, input validation.
Interview: how to prevent SQL injection & XSS. TRICKY: stored vs reflected vs DOM XSS; SSRF to cloud metadata
(169.254.169.254) credential theft. Challenge: find & fix vulnerabilities in a snippet.` },

  // ---------------- Interview Prep ----------------
  { id:'behavioral-star', title:'Behavioral Interviews (STAR)', category:'Interview Prep', subcategory:'Soft Skills', difficulty:'mid',
    focus:`The STAR method (Situation, Task, Action, Result), telling impact-driven stories, leadership/conflict/
failure/ownership questions, seniority signals, quantifying impact, the "tell me about a time you disagreed",
"biggest failure", "led without authority" archetypes, red flags to avoid, questions to ask the interviewer.
Provide several worked STAR example answers. Interview: how to structure a conflict story. Challenge: turn a raw
experience into a polished STAR answer (provide a template + a filled example).` },
]

phase('Topics')
log(`Authoring ${TOPICS.length} topics in parallel (agents write JSON directly).`)

const results = await parallel(TOPICS.map((t) => () =>
  agent(
    `${RULES}\n\n=== YOUR TOPIC ===\n` +
    `id: ${t.id}\ntitle: ${t.title}\ncategory: ${t.category}\nsubcategory: ${t.subcategory}\n` +
    `default difficulty: ${t.difficulty}\n\nMUST COVER (topic-specific):\n${t.focus}\n\n` +
    `Write the file to EXACTLY: ${DATA}/topics/${t.id}.json\n` +
    `Remember: valid JSON only, hit every minimum, cover all 11 elements, return the one-line summary.`,
    { label: `topic:${t.id}`, phase: 'Topics', effort: 'high' }
  ).then((r) => ({ id: t.id, summary: r })).catch((e) => ({ id: t.id, error: String(e) }))
))

phase('Aggregate')
// Cross-topic challenges file
const chSummary = await agent(
  `You are a Principal Engineer authoring the cross-topic CHALLENGE library for DevMaster Hub.\n` +
  `Use the Write tool to write valid JSON to EXACTLY ${DATA}/challenges.json.\n` +
  `Shape: an array of objects: {"id":string,"title":string,"difficulty":"junior"|"mid"|"senior",` +
  `"category":string,"prompt":string,"hints":string[],"solutionCode":string,"solutionLanguage":string,` +
  `"explanation":string,"relatedTopic":string}.\n` +
  `Author 18-24 high-quality challenges spread across categories Frontend, Backend, Architecture, Cloud, DevOps,` +
  ` Computer Science. MUST include these flagship ones: (1) Architecture/senior "Design a scalable payment system"` +
  ` (idempotency, ledger, exactly-once); (2) Backend/senior "Fix the transaction problem" (Spring @Transactional` +
  ` self-invocation proxy bug, with broken code in prompt and fixed solutionCode); (3) Frontend/mid "Optimize` +
  ` Angular rendering" (OnPush/trackBy/signals/virtual scroll). Each must have 3-5 progressive hints, a real working` +
  ` solutionCode, and a thorough explanation. relatedTopic should match an existing topic id where possible.\n` +
  `No placeholders. Return one-line JSON summary {"challenges":N}.`,
  { label: 'challenges', phase: 'Aggregate', effort: 'high' }
).then((r) => ({ ok: true, summary: r })).catch((e) => ({ error: String(e) }))

const okTopics = results.filter((r) => !r.error)
const failed = results.filter((r) => r.error)
return { authored: okTopics.length, failedIds: failed.map((f) => f.id), challenges: chSummary, total: TOPICS.length }
