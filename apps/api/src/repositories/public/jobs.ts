export type PublicJobsQuery = {
  readonly limit: number;
  readonly cursor: number;
  readonly type?: string;
};

export type PublicJob = {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly location: string;
  readonly postedAt: string;
};

export type PublicJobsResult = {
  readonly data: PublicJob[];
  readonly total: number;
  readonly nextCursor: number | null;
};

const PUBLIC_JOBS: readonly PublicJob[] = [
  {
    id: "job_1",
    title: "Gameplay Scripter",
    type: "scripting",
    location: "remote",
    postedAt: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "job_2",
    title: "Systems Scripter",
    type: "scripting",
    location: "remote",
    postedAt: "2026-03-21T09:00:00.000Z",
  },
  {
    id: "job_3",
    title: "Environment Builder",
    type: "building",
    location: "remote",
    postedAt: "2026-03-22T08:00:00.000Z",
  },
];

export function listPublicJobs(query: PublicJobsQuery): PublicJobsResult {
  const filtered = query.type
    ? PUBLIC_JOBS.filter((job) => job.type === query.type)
    : PUBLIC_JOBS;

  const page = filtered.slice(query.cursor, query.cursor + query.limit);
  const nextCursor = query.cursor + query.limit < filtered.length ? query.cursor + query.limit : null;

  return {
    data: [...page],
    total: filtered.length,
    nextCursor,
  };
}
