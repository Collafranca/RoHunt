export type PublicStatus = {
  readonly ok: true;
  readonly service: "api";
  readonly version: "v1";
};

export function getPublicStatus(): PublicStatus {
  return {
    ok: true,
    service: "api",
    version: "v1",
  };
}
