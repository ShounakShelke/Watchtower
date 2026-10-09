import { PrismaClient, Priority, TaskStatus, EventType, PlanStatus, PlanItemType, ActionRequestStatus, MemoryCandidateStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Watchtower V2 database...");

  // 1. User
  const user = await prisma.user.upsert({
    where: { email: process.env.AUTH_EMAIL || "local@watchtower.app" },
    update: {},
    create: {
      email: process.env.AUTH_EMAIL || "local@watchtower.app",
      displayName: "Shounak",
      timezone: "Asia/Kolkata",
    },
  });

  // 2. Projects
  const watchtower = await prisma.project.upsert({
    where: { id: "seed-watchtower" },
    update: {},
    create: {
      id: "seed-watchtower",
      userId: user.id,
      name: "Watchtower",
      description: "Personal AI operating system & autonomous digital agent",
      goal: "Ship complete V2 with dynamic planning & agent tool-calling",
      progress: 55,
      priority: Priority.CRITICAL,
      deadline: new Date(Date.now() + 14 * 86400000),
    },
  });

  const gt2 = await prisma.project.upsert({
    where: { id: "seed-gt2" },
    update: {},
    create: {
      id: "seed-gt2",
      userId: user.id,
      name: "GT2",
      description: "Competitor telemetry analysis & endurance GT racing study",
      goal: "Finalize benchmark report",
      progress: 67,
      priority: Priority.HIGH,
      deadline: new Date(Date.now() + 5 * 86400000),
    },
  });

  const medlmp = await prisma.project.upsert({
    where: { id: "seed-medlmp" },
    update: {},
    create: {
      id: "seed-medlmp",
      userId: user.id,
      name: "MedLMP",
      description: "Medical language-model clinical benchmark project",
      goal: "Complete evaluation framework",
      progress: 20,
      priority: Priority.MEDIUM,
      deadline: new Date(Date.now() + 30 * 86400000),
    },
  });

  // 3. Tasks
  await prisma.task.deleteMany({ where: { userId: user.id, source: "seed" } });

  const seedTasks = [
    {
      title: "Finish GT2 preprocessing pipeline",
      projectId: gt2.id,
      priority: Priority.CRITICAL,
      dueDate: new Date(Date.now() + 2 * 86400000),
      estimatedMinutes: 75,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: "Evaluate MedLMP zero-shot benchmarks",
      projectId: medlmp.id,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 4 * 86400000),
      estimatedMinutes: 90,
      status: TaskStatus.TODO,
    },
    {
      title: "Validate Watchtower V2 tool schemas",
      projectId: watchtower.id,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 1 * 86400000),
      estimatedMinutes: 45,
      status: TaskStatus.DONE,
    },
    {
      title: "Review telemetry logs from Nürburgring 24H",
      projectId: gt2.id,
      priority: Priority.MEDIUM,
      dueDate: new Date(Date.now() + 6 * 86400000),
      estimatedMinutes: 60,
      status: TaskStatus.TODO,
    },
  ];

  for (const t of seedTasks) {
    await prisma.task.create({
      data: {
        userId: user.id,
        projectId: t.projectId,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status,
        source: "seed",
      },
    });
  }

  // 4. Calendar Events (Today)
  const todayMorning = new Date();
  todayMorning.setHours(9, 30, 0, 0);
  const todayClassEnd = new Date();
  todayClassEnd.setHours(11, 0, 0, 0);

  const afternoonLab = new Date();
  afternoonLab.setHours(14, 0, 0, 0);
  const afternoonLabEnd = new Date();
  afternoonLabEnd.setHours(15, 30, 0, 0);

  await prisma.calendarEvent.deleteMany({ where: { userId: user.id, provider: "seed" } });

  await prisma.calendarEvent.createMany({
    data: [
      {
        userId: user.id,
        title: "Machine Learning Seminar",
        startTime: todayMorning,
        endTime: todayClassEnd,
        eventType: EventType.CLASS,
        isFixed: true,
        provider: "seed",
      },
      {
        userId: user.id,
        title: "Lab Session — Systems Architecture",
        startTime: afternoonLab,
        endTime: afternoonLabEnd,
        eventType: EventType.STUDY,
        isFixed: true,
        provider: "seed",
      },
    ],
  });

  // 5. Durable Memories & Memory Candidates
  await prisma.memory.upsert({
    where: { userId_key: { userId: user.id, key: "pref_deep_work_window" } },
    update: {},
    create: {
      userId: user.id,
      category: "routine",
      key: "pref_deep_work_window",
      value: "Prefers high-intensity analytical work between 8:00 AM and 11:30 AM.",
      confidence: 0.95,
      source: "seed",
    },
  });

  await prisma.memory.upsert({
    where: { userId_key: { userId: user.id, key: "pref_break_style" } },
    update: {},
    create: {
      userId: user.id,
      category: "health",
      key: "pref_break_style",
      value: "Prefers 15-minute walks to clear mental fatigue after 90m focus blocks.",
      confidence: 0.85,
      source: "seed",
    },
  });

  await prisma.memoryCandidate.deleteMany({ where: { userId: user.id, sourceType: "seed" } });
  await prisma.memoryCandidate.create({
    data: {
      userId: user.id,
      category: "preference",
      key: "pref_motorsport_interest",
      value: "Focuses deeply on GT World Challenge, IMSA GTP, and WEC endurance categories.",
      reason: "Observed in imported chat history and reading patterns.",
      confidence: 0.82,
      sourceType: "seed",
      status: MemoryCandidateStatus.PENDING,
    },
  });

  // 6. Knowledge Documents
  await prisma.knowledge.deleteMany({ where: { userId: user.id, sourceType: "seed" } });
  await prisma.knowledge.createMany({
    data: [
      {
        userId: user.id,
        title: "GT2 Competitor Benchmark Architecture",
        content: "Documenting GT2 aerodynamic drag coefficients and thermal dissipation modeling across 24h stints. Concluded that brake temperature spikes require modified intake ducts.",
        sourceType: "seed",
        sourceReference: "gt2_notes.md",
      },
      {
        userId: user.id,
        title: "MedLMP Zero-Shot Evaluation Criteria",
        content: "Evaluated MedLMP on MedQA and PubMedQA benchmarks. Model demonstrates strong diagnostic reasoning on pharmacology questions but needs refinement on rare metabolic cases.",
        sourceType: "seed",
        sourceReference: "medlmp_evaluation.md",
      },
    ],
  });

  // 7. Behavioral Patterns
  await prisma.behaviorPattern.upsert({
    where: { userId_patternType: { userId: user.id, patternType: "focus_efficiency" } },
    update: {},
    create: {
      userId: user.id,
      patternType: "focus_efficiency",
      valueJson: { peakHour: 9, optimalBlockMinutes: 75, fatigueThresholdHours: 5.5 },
      confidence: 0.88,
      sampleCount: 14,
    },
  });

  console.log("Watchtower V2 database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
