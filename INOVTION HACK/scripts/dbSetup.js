import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
// Connection string comes from the environment. A hardcoded Supabase password
// was previously committed here and published with the repository.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log("⚡ Connecting to Supabase PostgreSQL Database...");

    // 1. User Profile Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        avatar TEXT,
        github VARCHAR(100),
        status VARCHAR(100),
        streak_days INT DEFAULT 0,
        commits_today INT DEFAULT 0,
        rank VARCHAR(100)
      );
    `);
    console.log("✅ Table 'user_profile' created/verified.");

    // 2. Projects Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        progress INT DEFAULT 0,
        completed_tasks INT DEFAULT 0,
        total_tasks INT DEFAULT 0,
        status VARCHAR(50),
        due_date VARCHAR(50),
        team_members TEXT[],
        tags TEXT[]
      );
    `);
    console.log("✅ Table 'projects' created/verified.");

    // 3. Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project VARCHAR(150) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        due_date VARCHAR(50),
        estimated_hours NUMERIC(5,2),
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'tasks' created/verified.");

    // 4. Activity Feed Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        repo VARCHAR(150),
        time VARCHAR(50),
        author VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'activities' created/verified.");

    // 5. Metrics Overview Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id VARCHAR(50) PRIMARY KEY,
        tasks_completed_value INT,
        tasks_completed_total INT,
        tasks_completed_percent INT,
        active_projects_count INT,
        hours_coded NUMERIC(5,2),
        sprint_velocity INT
      );
    `);
    console.log("✅ Table 'metrics' created/verified.");

    // Clear existing sample rows for clean seed
    await client.query("TRUNCATE user_profile, projects, tasks, activities, metrics CASCADE;");

    // SEEDING INITIAL DATA

    // User Profile Seed
    await client.query(`
      INSERT INTO user_profile (id, name, role, email, avatar, github, status, streak_days, commits_today, rank)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      "user-1",
      "Alex Rivera",
      "Senior Full Stack Engineer",
      "alex.rivera@innovationhacks.dev",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
      "@arivera-dev",
      "In Deep Work",
      14,
      18,
      "Top 5% Productivity"
    ]);

    // Metrics Seed
    await client.query(`
      INSERT INTO metrics (id, tasks_completed_value, tasks_completed_total, tasks_completed_percent, active_projects_count, hours_coded, sprint_velocity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ["m-1", 24, 30, 80, 4, 38.50, 92]);

    // Projects Seed
    const projectsData = [
      ["proj-1", "AI Code Assistant API", "Backend / Microservices", "High-throughput streaming API pipeline for real-time code autocompletion.", 85, 17, 20, "In Progress", "2026-09-02", ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"], ["Node.js", "gRPC", "Redis"]],
      ["proj-2", "Design System 2.0 UI Kit", "Frontend Architecture", "Accessible, dark-first component library built with React & Tailwind CSS.", 60, 12, 20, "In Progress", "2026-09-10", ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"], ["React", "Tailwind", "Storybook"]],
      ["proj-3", "Realtime Analytics Dashboard", "Web Application", "Live WebSocket-powered metrics and log streaming interface.", 100, 15, 15, "Completed", "2026-08-25", ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"], ["Next.js", "WebSockets", "Recharts"]],
      ["proj-4", "Auth0 & OAuth2 Security Audit", "DevOps / Security", "JWT token rotation, session validation, and rate-limiting middleware.", 40, 4, 10, "In Review", "2026-09-15", ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"], ["OAuth2", "Security", "Docker"]]
    ];

    for (const p of projectsData) {
      await client.query(`
        INSERT INTO projects (id, name, category, description, progress, completed_tasks, total_tasks, status, due_date, team_members, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, p);
    }

    // Tasks Seed
    const tasksData = [
      ["task-101", "Optimize gRPC streaming latency for code suggestions", "AI Code Assistant API", "High", "In Progress", "Today", 4.0, ["Performance", "Backend"]],
      ["task-102", "Implement accessible keyboard navigation in Modal component", "Design System 2.0 UI Kit", "High", "In Progress", "Tomorrow", 3.0, ["Accessibility", "A11y"]],
      ["task-103", "Write unit tests for OAuth token refresh middleware", "Auth0 & OAuth2 Security Audit", "Medium", "Pending", "Aug 30", 5.0, ["Testing", "Security"]],
      ["task-104", "Refactor global state management using Zustand store", "Design System 2.0 UI Kit", "Medium", "Completed", "Aug 26", 6.0, ["Refactor", "React"]],
      ["task-105", "Configure Redis cache invalidation hooks on deployment", "AI Code Assistant API", "High", "Pending", "Sep 01", 2.5, ["Redis", "DevOps"]],
      ["task-106", "Setup CI/CD pipeline GitHub Actions for auto-formatting", "Realtime Analytics Dashboard", "Low", "Completed", "Aug 24", 2.0, ["CI/CD", "GitHub"]]
    ];

    for (const t of tasksData) {
      await client.query(`
        INSERT INTO tasks (id, title, project, priority, status, due_date, estimated_hours, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, t);
    }

    // Activities Seed
    const activitiesData = [
      ["act-1", "commit", "feat(grpc): optimize socket connection pool for sub-50ms responses", "innovation-hacks/ai-code-api", "25 mins ago", "Alex Rivera"],
      ["act-2", "pr", "pr #42 merged: add dark mode glassmorphism theme tokens", "innovation-hacks/ui-kit", "2 hours ago", "Alex Rivera"],
      ["act-3", "deploy", "production deploy v2.4.1 successful (0 downtime)", "innovation-hacks/analytics-web", "5 hours ago", "GitHub Actions Bot"],
      ["act-4", "review", "approved PR #18: JWT Security Middleware updates", "innovation-hacks/auth-audit", "Yesterday", "Alex Rivera"]
    ];

    for (const a of activitiesData) {
      await client.query(`
        INSERT INTO activities (id, type, message, repo, time, author)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, a);
    }

    console.log("🎉 Database schema and seed data created successfully in Supabase PostgreSQL!");

  } catch (err) {
    console.error("❌ Database setup error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
