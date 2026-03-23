export type AdminPlatformStats = {
  readonly users: {
    readonly total: number;
  };
  readonly jobs: {
    readonly total: number;
  };
};

export function getAdminPlatformStats(): AdminPlatformStats {
  return {
    users: {
      total: 2,
    },
    jobs: {
      total: 3,
    },
  };
}
