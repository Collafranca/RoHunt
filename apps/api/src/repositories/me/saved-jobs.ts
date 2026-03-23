export type SavedJob = {
  readonly id: string;
  readonly userId: string;
  readonly jobId: string;
  readonly savedAt: string;
};

const savedJobsByUserId = new Map<string, Map<string, SavedJob>>();
let savedJobSequence = 0;

function getUserSavedJobsStore(userId: string): Map<string, SavedJob> {
  let store = savedJobsByUserId.get(userId);

  if (!store) {
    store = new Map<string, SavedJob>();
    savedJobsByUserId.set(userId, store);
  }

  return store;
}

export function listSavedJobsByUserId(userId: string): SavedJob[] {
  const store = savedJobsByUserId.get(userId);

  if (!store) {
    return [];
  }

  return [...store.values()];
}

export function saveJobForUser(userId: string, jobId: string): SavedJob {
  const store = getUserSavedJobsStore(userId);
  const existing = store.get(jobId);

  if (existing) {
    return existing;
  }

  savedJobSequence += 1;

  const savedJob: SavedJob = {
    id: `saved_job_${savedJobSequence}`,
    userId,
    jobId,
    savedAt: new Date().toISOString(),
  };

  store.set(jobId, savedJob);

  return savedJob;
}

export function unsaveJobForUser(userId: string, jobId: string): boolean {
  const store = savedJobsByUserId.get(userId);

  if (!store) {
    return false;
  }

  const removed = store.delete(jobId);

  if (store.size === 0) {
    savedJobsByUserId.delete(userId);
  }

  return removed;
}
