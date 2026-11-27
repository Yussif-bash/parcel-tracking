import type { AddressInfo } from "node:net";
import { app } from "./app.ts";
import { createSession } from "./auth/session-repository.ts";
import { createUser } from "./users/user-repository.ts";
import type { UserRole } from "./users/users-schema.ts";

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

let phoneCounter = 0;

export async function loginAs(role: UserRole): Promise<{userId: string, cookie: string}>{
    phoneCounter += 1;
    const user = await createUser({
        name: `Test ${role}`,
        phone: `+23320000${String(phoneCounter).padStart(4, "0")}`,
        role
    }, "unused-hash");

    const {token} = await createSession(user.id);

    return {userId: user.id, cookie:`session=${token}`}
};

export async function sessionCookieForTest(role: UserRole): Promise<string> {
    return (await loginAs(role)).cookie;
}