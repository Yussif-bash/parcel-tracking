import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import {afterAll, beforeAll, describe, expect, it} from "vitest"
import { app } from "./app.ts";

let server: Server;
let baseUrl: string;

beforeAll(async( ) => {
    server = app.listen(0);
    await new Promise<void>((resolve) => {
        server.once("listening", () => resolve());
    });

    const {port} = server.address() as AddressInfo
    baseUrl = `http://localhost:${port}`
})

afterAll(async( ) => {
    server.close()
})

describe("health", () =>{
    it("GET /health returns Ok", async() =>{
        const res = await fetch(`${baseUrl}/health`);
        expect (res.status).toBe(200);
        expect (await res.json()).toEqual({status: "Ok"})
    });

    it("Unkwown address returns 404", async() => {
        const res = await fetch(`${baseUrl}/something`);
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({error: "Not Found"})
    })
})