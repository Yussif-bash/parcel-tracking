process.loadEnvFile(new URL("../.env.test", import.meta.url));

if(!process.env.DATABASE_URL?.endsWith("_test")){
    throw new Error("Refusing to run tests: DATABASE_URL must point to a database ending in _test")
}