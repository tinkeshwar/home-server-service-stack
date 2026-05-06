import { spawn } from "child_process";
import { NextRequest } from "next/server";

let lastExecution = 0;

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Date.now();
  if (now - lastExecution < 60000) {
    return new Response("Rate limited. Wait 60 seconds between executions.", { status: 429 });
  }
  lastExecution = now;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const proc = spawn("bash", ["/app/scripts/restart-is.sh"]);

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      proc.stdout.on("data", (chunk) => {
        chunk.toString().split("\n").filter(Boolean).forEach(send);
      });

      proc.stderr.on("data", (chunk) => {
        chunk.toString().split("\n").filter(Boolean).forEach((line: string) => send(`[ERROR] ${line}`));
      });

      proc.on("close", (code) => {
        send(code === 0 ? "✓ All done!" : `✗ Exited with code ${code}`);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      proc.on("error", (err) => {
        send(`[ERROR] ${err.message}`);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
