"use client";

import { useEffect } from "react";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    captureMonitoringException(error, {
      area: "application",
      recovery_boundary: "root_layout",
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#f7f8fc", color: "#18213a", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ alignItems: "flex-start", display: "flex", justifyContent: "center", minHeight: "100vh", padding: "12vh 20px" }}>
          <section aria-labelledby="global-error-title" role="alert" style={{ background: "white", border: "1px solid #e3e7f1", borderRadius: 18, boxShadow: "0 18px 50px rgba(42, 35, 91, 0.09)", maxWidth: 560, padding: "36px", width: "100%" }}>
            <h1 id="global-error-title" style={{ fontSize: 30, letterSpacing: "-.03em", margin: "0 0 10px" }}>The application shell needs to restart</h1>
            <p style={{ color: "#5c6780", lineHeight: 1.65, margin: "0 0 24px" }}>Saved remote content was not changed. Restart the shell to continue; locally held editor state remains available when the browser can recover it.</p>
            {error.digest ? <p style={{ color: "#788299", fontSize: 12 }}>Recovery reference: {error.digest}</p> : null}
            <button onClick={retry} style={{ background: "#5637f5", border: 0, borderRadius: 10, color: "white", cursor: "pointer", font: "inherit", fontWeight: 700, padding: "12px 18px" }} type="button">Restart application</button>
          </section>
        </main>
      </body>
    </html>
  );
}
