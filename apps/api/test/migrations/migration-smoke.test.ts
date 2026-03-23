import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../../migrations");

const migrationFiles = [
  "0001_initial_identity.sql",
  "0002_reference_data.sql",
  "0003_jobs_ingestion.sql",
  "0004_scams_trust.sql",
  "0005_notifications.sql",
  "0006_ai_features.sql",
  "0007_ops_security.sql",
];

async function readMigration(fileName: string) {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  await access(filePath);
  return readFile(filePath, "utf8");
}

describe("SQL migration baseline", () => {
  it("includes all baseline migration files", async () => {
    await Promise.all(
      migrationFiles.map(async (fileName) => {
        const filePath = path.join(MIGRATIONS_DIR, fileName);
        await expect(access(filePath)).resolves.toBeUndefined();
      })
    );
  });

  it("defines required domain tables with UUID primary keys", async () => {
    const allSql = (await Promise.all(migrationFiles.map(readMigration))).join("\n\n");

    const requiredTables = [
      "users",
      "identity_links",
      "roles",
      "user_roles",
      "skills",
      "jobs",
      "job_sources",
      "job_ingestions",
      "job_skill_tags",
      "scam_reports",
      "trust_events",
      "notifications",
      "user_notification_preferences",
      "ai_portfolio_reviews",
      "ai_job_matches",
      "api_keys",
      "audit_logs",
    ];

    for (const table of requiredTables) {
      expect(allSql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\s*\\(`, "i"));
      expect(allSql).toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\s*\\([\\s\\S]*?id\\s+UUID\\s+PRIMARY KEY\\s+DEFAULT\\s+gen_random_uuid\\(\\)`, "i")
      );
    }
  });

  it("uses UTC-compatible timestamps by default", async () => {
    const allSql = (await Promise.all(migrationFiles.map(readMigration))).join("\n\n");

    expect(allSql).toMatch(/TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+timezone\('utc',\s*now\(\)\)/i);
  });

  it("defines key foreign keys", async () => {
    const allSql = (await Promise.all(migrationFiles.map(readMigration))).join("\n\n");

    const requiredFks = [
      /FOREIGN KEY\s*\(user_id\)\s*REFERENCES\s+users\s*\(id\)/i,
      /FOREIGN KEY\s*\(job_id\)\s*REFERENCES\s+jobs\s*\(id\)/i,
      /FOREIGN KEY\s*\(skill_id\)\s*REFERENCES\s+skills\s*\(id\)/i,
      /FOREIGN KEY\s*\(source_id\)\s*REFERENCES\s+job_sources\s*\(id\)/i,
    ];

    for (const fkPattern of requiredFks) {
      expect(allSql).toMatch(fkPattern);
    }
  });

  it("defines required check constraints for bounded domains", async () => {
    const allSql = (await Promise.all(migrationFiles.map(readMigration))).join("\n\n");

    const requiredChecks = [
      /CONSTRAINT\s+ck_jobs_status\s+CHECK\s*\(status\s+IN\s*\('open',\s*'filled',\s*'closed'\)\)/i,
      /CONSTRAINT\s+ck_scam_reports_status\s+CHECK\s*\(status\s+IN\s*\('open',\s*'investigating',\s*'resolved',\s*'dismissed'\)\)/i,
      /CONSTRAINT\s+ck_job_skill_tags_confidence\s+CHECK\s*\(confidence\s+IS\s+NULL\s+OR\s*\(confidence\s*>=\s*0\s+AND\s+confidence\s*<=\s*1\)\)/i,
      /CONSTRAINT\s+ck_ai_job_matches_match_score\s+CHECK\s*\(match_score\s*>=\s*0\s+AND\s+match_score\s*<=\s*1\)/i,
      /CONSTRAINT\s+ck_ai_portfolio_reviews_score\s+CHECK\s*\(score\s+IS\s+NULL\s+OR\s*\(score\s*>=\s*0\s+AND\s+score\s*<=\s*100\)\)/i,
      /CONSTRAINT\s+ck_audit_logs_actor_reference\s+CHECK\s*\(actor_user_id\s+IS\s+NOT\s+NULL\s+OR\s+actor_api_key_id\s+IS\s+NOT\s+NULL\)/i,
    ];

    for (const checkPattern of requiredChecks) {
      expect(allSql).toMatch(checkPattern);
    }
  });

  it("defines critical domain indexes", async () => {
    const allSql = (await Promise.all(migrationFiles.map(readMigration))).join("\n\n");

    const requiredIndexes = [
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_users_discord_id\s+ON\s+users\s*\(discord_id\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_jobs_status_posted_at\s+ON\s+jobs\s*\(status,\s*posted_at\s+DESC\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_job_ingestions_source_external_id\s+ON\s+job_ingestions\s*\(source_id,\s*external_message_id\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_scam_reports_status_created_at\s+ON\s+scam_reports\s*\(status,\s*created_at\s+DESC\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_notifications_user_read_created\s+ON\s+notifications\s*\(user_id,\s*read_at,\s*created_at\s+DESC\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_ai_job_matches_user_score\s+ON\s+ai_job_matches\s*\(user_id,\s*match_score\s+DESC\)/i,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_audit_logs_actor_created_at\s+ON\s+audit_logs\s*\(actor_user_id,\s*created_at\s+DESC\)/i,
    ];

    for (const indexPattern of requiredIndexes) {
      expect(allSql).toMatch(indexPattern);
    }
  });
});
