import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { hashPassword } from "./auth/password.ts";
import { pool } from "./db.ts";
import { createUser, phoneInUseError } from "./users/user-repository.ts";
import { createUserSchema } from "./users/users-schema.ts";

const { values } = parseArgs({
    options: {
        name: {type: "string"},
        phone: {type: "string"},
        role: {type: "string"}
    }
});


const passed = createUserSchema.safeParse(values);

if(!passed.success){
    for (const issues of passed.error.issues){
        console.error(`${issues.path.join(" . ")}: ${issues.message}`);
    }

    process.exit(1);
};

const temporaryPassword = randomBytes(12).toString("base64url");


try {
    const user = await createUser(passed.data, await hashPassword(temporaryPassword));
    console.log(`Created ${user.role}, ${user.name}, ${user.phone}`);
    console.log(`Temporary Password (Shown once, save it now): ${temporaryPassword}`);
    
} catch (error) {

    if(error instanceof phoneInUseError){
        console.error(error.message);
        process.exitCode = 1
    }else{
        throw error
    }
    
}finally{
    await pool.end()
}