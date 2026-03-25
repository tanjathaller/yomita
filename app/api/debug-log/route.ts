import { appendFile } from "node:fs/promises";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    await appendFile("debug-a1c28a.log", `${body}\n`, "utf8").catch(() => {});
    await fetch("http://127.0.0.1:7813/ingest/dc7b762f-cf89-4e11-830b-655b2e5149c1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "a1c28a",
      },
      body,
    }).catch(() => {});
  } catch {
    // ignore
  }

  return new Response(null, { status: 204 });
}

