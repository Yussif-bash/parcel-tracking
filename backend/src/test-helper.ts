import type { AddressInfo } from "node:net";
import { app } from "./app.ts";

/** Starts the app on a free port for a test file. Call `close()` when the tests finish. */
export async function startTestServer() {
    const server = app.listen(0);
    await new Promise<void>((resolve) => {
        server.once("listening", () => resolve());
    });

    const { port } = server.address() as AddressInfo;

    return {
        baseUrl: `http://localhost:${port}`,
        close: () => {
            server.closeAllConnections();
            server.close()
        }
    }
}