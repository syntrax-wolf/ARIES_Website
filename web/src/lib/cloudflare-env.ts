import { env } from "cloudflare:workers";

type R2Object = { body: ReadableStream; httpMetadata?: { contentType?: string } };

export type WorkerEnv = {
  DB?: {
    prepare(query: string): {
      bind(...values: unknown[]): unknown;
      first<T>(): Promise<T | null>;
      all<T>(): Promise<{ results?: T[] }>;
      run(): Promise<unknown>;
    };
  };
  MEDIA?: {
    get(key: string): Promise<R2Object | null>;
    put(
      key: string,
      value: ArrayBuffer | Uint8Array,
      options?: { httpMetadata?: { contentType: string } },
    ): Promise<unknown>;
  };
  SESSION_SECRET?: string;
  ADMIN_PASSWORD?: string;
  DEVCLUB_CLIENT_ID?: string;
  DEVCLUB_CLIENT_SECRET?: string;
  DEVCLUB_REDIRECT_URI?: string;
  ARIES_ALLOWLIST?: string;
  MEDIA_PUBLIC_BASE?: string;
  REBUILD_HOOK_URL?: string;
};

export function workerEnv(): WorkerEnv {
  return env as WorkerEnv;
}

/** Worker secret/var, then process.env for `astro dev`. */
export function runtimeVar(name: keyof WorkerEnv | string): string {
  const fromBinding = (workerEnv() as Record<string, unknown>)[name];
  if (typeof fromBinding === "string" && fromBinding) return fromBinding;
  return process.env[name] ?? "";
}
