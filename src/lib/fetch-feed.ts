import { describeNetworkError, isRetriableNetworkError } from "./net-error";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

const USER_AGENT = "application-scout/0.1 (personal internship tracker)";

type Downloaded = { status: number; body: string; finalUrl: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Node https/http — bypasses Next.js patched fetch, which struggles with ~12MB listings.json. */
export function downloadText(
  url: string,
  options: { timeoutMs?: number; redirectCount?: number } = {},
): Promise<Downloaded> {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const redirectCount = options.redirectCount ?? 0;

  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }

    const transport = parsed.protocol === "http:" ? httpRequest : httpsRequest;
    const req = transport(
      parsed,
      {
        method: "GET",
        headers: {
          "user-agent": USER_AGENT,
          accept: "application/json,text/plain,*/*",
        },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          if (redirectCount >= 4) {
            res.resume();
            reject(new Error(`${url} redirected too many times`));
            return;
          }
          const next = new URL(res.headers.location, parsed).toString();
          res.resume();
          resolve(downloadText(next, { timeoutMs, redirectCount: redirectCount + 1 }));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          resolve({
            status,
            body: Buffer.concat(chunks).toString("utf8"),
            finalUrl: url,
          });
        });
        res.on("error", reject);
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(Object.assign(new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s fetching ${parsed.host}`), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
    req.end();
  });
}

export async function fetchJsonFeed(
  url: string,
  options: {
    timeoutMs?: number;
    attempts?: number;
    retryDelayMs?: number;
    download?: typeof downloadText;
  } = {},
): Promise<unknown> {
  const attempts = options.attempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const retryDelayMs = options.retryDelayMs ?? 400;
  const download = options.download ?? downloadText;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await download(url, { timeoutMs });
      if (result.status === 429 || result.status >= 500) {
        throw Object.assign(new Error(`${url} returned ${result.status}`), { code: String(result.status) });
      }
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`${url} returned ${result.status}`);
      }
      try {
        return JSON.parse(result.body) as unknown;
      } catch {
        throw new Error(`${url} returned non-JSON (${result.body.slice(0, 80).replace(/\s+/g, " ")})`);
      }
    } catch (error) {
      lastError = error;
      const retriable = isRetriableNetworkError(error);
      if (!retriable || attempt === attempts) break;
      await sleep(retryDelayMs * 2 ** (attempt - 1));
    }
  }

  throw new Error(describeNetworkError(lastError));
}
