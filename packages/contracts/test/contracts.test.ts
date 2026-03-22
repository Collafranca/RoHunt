import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import * as contractsClient from "../src/index";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ContractOperation = {
  readonly operationId: string;
  readonly method: HttpMethod;
  readonly path: string;
};

type YamlRecord = Record<string, unknown>;

const METHOD_ORDER: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const REQUIRED_DOMAIN_PREFIXES = ["/v1/public", "/v1/me", "/v1/admin", "/v1/internal"] as const;

function isYamlRecord(value: unknown): value is YamlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseYamlRecord(filePath: string, context: string): YamlRecord {
  const parsed = parse(readFileSync(filePath, "utf-8"));
  if (!isYamlRecord(parsed)) {
    throw new Error(`Expected ${context} at ${filePath} to be a YAML object.`);
  }

  return parsed;
}

function decodeJsonPointerSegment(segment: string): string {
  return decodeURIComponent(segment).replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveJsonPointer(document: unknown, pointer: string, context: string): unknown {
  if (pointer.length === 0) {
    return document;
  }

  if (!pointer.startsWith("/")) {
    throw new Error(`Invalid JSON pointer for ${context}: ${pointer}`);
  }

  let current: unknown = document;

  for (const rawSegment of pointer.slice(1).split("/")) {
    const segment = decodeJsonPointerSegment(rawSegment);

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        throw new Error(`Invalid array index '${segment}' while resolving ${context}.`);
      }

      current = current[index];
      continue;
    }

    if (!isYamlRecord(current) || !(segment in current)) {
      throw new Error(`Missing JSON pointer segment '${segment}' while resolving ${context}.`);
    }

    current = current[segment];
  }

  return current;
}

function getOperationsFromPathItem(pathItem: YamlRecord, path: string): ContractOperation[] {
  const operations: ContractOperation[] = [];

  for (const method of METHOD_ORDER) {
    const operationNode = pathItem[method.toLowerCase()];
    if (!isYamlRecord(operationNode)) {
      continue;
    }

    const operationId = operationNode.operationId;
    if (typeof operationId !== "string" || operationId.length === 0) {
      throw new Error(`Missing operationId for ${method} ${path}.`);
    }

    operations.push({ operationId, method, path });
  }

  return operations;
}

function getOpenapiOperations(openapiRootPath: string): ContractOperation[] {
  const openapiDir = dirname(openapiRootPath);
  const rootDocument = parseYamlRecord(openapiRootPath, "OpenAPI root");
  const rootPathsNode = rootDocument.paths;

  if (!isYamlRecord(rootPathsNode)) {
    throw new Error(`Expected 'paths' in ${openapiRootPath} to be a YAML object.`);
  }

  const rootPathEntries = Object.entries(rootPathsNode);

  const pathDocumentCache = new Map<string, YamlRecord>();
  const operations: ContractOperation[] = [];

  for (const [path, pathReferenceNode] of rootPathEntries) {
    if (!isYamlRecord(pathReferenceNode)) {
      throw new Error(`Expected path entry for '${path}' to be a YAML object.`);
    }

    const refValue = pathReferenceNode.$ref;
    if (typeof refValue !== "string" || refValue.length === 0) {
      throw new Error(`Expected path '${path}' to define a non-empty $ref.`);
    }

    const [relativeFilePath, jsonPointer = ""] = refValue.split("#", 2);
    if (!relativeFilePath) {
      throw new Error(`Missing file reference in $ref for '${path}'.`);
    }

    const absoluteFilePath = resolve(openapiDir, relativeFilePath);

    if (!pathDocumentCache.has(absoluteFilePath)) {
      pathDocumentCache.set(absoluteFilePath, parseYamlRecord(absoluteFilePath, `path document for ${path}`));
    }

    const referencedDocument = pathDocumentCache.get(absoluteFilePath);
    if (!referencedDocument) {
      throw new Error(`Failed to load referenced path document for '${path}'.`);
    }

    const resolvedPathItem = resolveJsonPointer(
      referencedDocument,
      jsonPointer,
      `$ref '${refValue}' for path '${path}'`,
    );

    if (!isYamlRecord(resolvedPathItem)) {
      throw new Error(`Expected $ref '${refValue}' for '${path}' to resolve to a path-item object.`);
    }

    operations.push(...getOperationsFromPathItem(resolvedPathItem, path));
  }

  return operations;
}

function isRequiredTask3Path(path: string): boolean {
  return REQUIRED_DOMAIN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

const testDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(testDir, "..");
const rootOpenapiPath = resolve(packageRoot, "openapi/root.yaml");
const generatedClientPath = resolve(packageRoot, "src/generated/client.ts");

describe("@rohunt/contracts", () => {
  it("defines required v1 route namespaces", () => {
    const rootDocument = parseYamlRecord(rootOpenapiPath, "OpenAPI root");
    const rootPathsNode = rootDocument.paths;

    if (!isYamlRecord(rootPathsNode)) {
      throw new Error(`Expected 'paths' in ${rootOpenapiPath} to be a YAML object.`);
    }

    const rootPaths = Object.keys(rootPathsNode);

    expect(rootPaths.some((path) => path.startsWith("/v1/public"))).toBe(true);
    expect(rootPaths.some((path) => path.startsWith("/v1/me"))).toBe(true);
    expect(rootPaths.some((path) => path.startsWith("/v1/admin"))).toBe(true);
    expect(rootPaths.some((path) => path.startsWith("/v1/internal"))).toBe(true);
  });

  it("keeps generated Task-3 operations aligned with OpenAPI operationId/method/path", () => {
    const expectedTask3Operations = getOpenapiOperations(rootOpenapiPath).filter((operation) =>
      isRequiredTask3Path(operation.path),
    );

    const generatedTask3Operations = contractsClient.operations.filter((operation) =>
      isRequiredTask3Path(operation.path),
    );

    expect(generatedTask3Operations).toEqual(expectedTask3Operations);

    for (const operation of expectedTask3Operations) {
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
