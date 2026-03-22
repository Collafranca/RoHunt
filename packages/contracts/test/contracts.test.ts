import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as contractsClient from "../src/index";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ContractOperation = {
  readonly operationId: string;
  readonly method: HttpMethod;
  readonly path: string;
};

type RootPathRef = {
  readonly path: string;
  readonly refPath: string;
};

type PathFileOperation = {
  readonly path: string;
  readonly method: HttpMethod;
  readonly operationId: string;
};

const METHOD_ORDER: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function parseRootPathRefs(rootSpec: string): RootPathRef[] {
  const refs: RootPathRef[] = [];
  const lines = rootSpec.split("\n");

  let currentPath: string | null = null;

  for (const line of lines) {
    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }

    const refMatch = line.match(/^    \$ref:\s+"([^"]+)"\s*$/);
    if (currentPath && refMatch) {
      refs.push({ path: currentPath, refPath: refMatch[1] });
      currentPath = null;
    }
  }

  return refs;
}

function parsePathFileOperations(pathSpec: string): PathFileOperation[] {
  const operations: PathFileOperation[] = [];
  const lines = pathSpec.split("\n");

  let currentPath: string | null = null;
  let currentMethod: HttpMethod | null = null;

  for (const line of lines) {
    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      currentMethod = null;
      continue;
    }

    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/i);
    if (currentPath && methodMatch) {
      currentMethod = methodMatch[1].toUpperCase() as HttpMethod;
      continue;
    }

    const operationIdMatch = line.match(/^      operationId:\s*([A-Za-z0-9_]+)\s*$/);
    if (currentPath && currentMethod && operationIdMatch) {
      operations.push({
        path: currentPath,
        method: currentMethod,
        operationId: operationIdMatch[1],
      });
      currentMethod = null;
    }
  }

  return operations;
}

function getOpenapiOperations(openapiRootPath: string): ContractOperation[] {
  const openapiDir = dirname(openapiRootPath);
  const rootSpec = readFileSync(openapiRootPath, "utf-8");
  const rootPathRefs = parseRootPathRefs(rootSpec);

  const pathFileCache = new Map<string, PathFileOperation[]>();
  const operations: ContractOperation[] = [];

  for (const rootPathRef of rootPathRefs) {
    const relativeFilePath = rootPathRef.refPath.split("#")[0];
    if (!relativeFilePath) {
      throw new Error(`Missing file reference for path ${rootPathRef.path}`);
    }

    const absoluteFilePath = resolve(openapiDir, relativeFilePath);

    if (!pathFileCache.has(absoluteFilePath)) {
      const pathSpec = readFileSync(absoluteFilePath, "utf-8");
      pathFileCache.set(absoluteFilePath, parsePathFileOperations(pathSpec));
    }

    const fileOperations = pathFileCache.get(absoluteFilePath) ?? [];
    const byPath = fileOperations.filter((operation) => operation.path === rootPathRef.path);

    for (const method of METHOD_ORDER) {
      const operation = byPath.find((item) => item.method === method);
      if (!operation) {
        continue;
      }

      operations.push({
        operationId: operation.operationId,
        method: operation.method,
        path: operation.path,
      });
    }
  }

  return operations;
}

const testDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(testDir, "..");
const rootOpenapiPath = resolve(packageRoot, "openapi/root.yaml");
const generatedClientPath = resolve(packageRoot, "src/generated/client.ts");
const REQUIRED_DOMAIN_PREFIXES = ["/v1/public", "/v1/me", "/v1/admin", "/v1/internal"] as const;

describe("@rohunt/contracts", () => {
  it("defines required v1 route namespaces", () => {
    const rootSpec = readFileSync(rootOpenapiPath, "utf-8");

    expect(rootSpec).toContain("/v1/public");
    expect(rootSpec).toContain("/v1/me");
    expect(rootSpec).toContain("/v1/admin");
    expect(rootSpec).toContain("/v1/internal");
  });

  it("keeps generated operations aligned with OpenAPI operationId/method/path", () => {
    const expectedOperations = getOpenapiOperations(rootOpenapiPath).filter((operation) =>
      REQUIRED_DOMAIN_PREFIXES.some((prefix) => operation.path.startsWith(prefix)),
    );

    const generatedOperations = contractsClient.operations.filter((operation) =>
      REQUIRED_DOMAIN_PREFIXES.some((prefix) => operation.path.startsWith(prefix)),
    );

    expect(generatedOperations).toEqual(expectedOperations);

    for (const operation of expectedOperations) {
      expect(contractsClient).toHaveProperty(operation.operationId);
      expect(contractsClient[operation.operationId]).toBeTypeOf("function");
      expect(contractsClient[operation.operationId]()).toEqual({
        method: operation.method,
        path: operation.path,
      });
    }
  });

  it("exports operation wrappers for every generated operation", () => {
    for (const operation of contractsClient.operations) {
      expect(contractsClient).toHaveProperty(operation.operationId);
      expect(contractsClient[operation.operationId]).toBeTypeOf("function");
      expect(contractsClient[operation.operationId]()).toEqual({
        method: operation.method,
        path: operation.path,
      });
    }
  });

  it("declares generated wrappers in generated source", () => {
    const generatedSource = readFileSync(generatedClientPath, "utf-8");

    for (const operation of contractsClient.operations) {
      expect(generatedSource).toContain(`export function ${operation.operationId}()`);
    }
  });
});
