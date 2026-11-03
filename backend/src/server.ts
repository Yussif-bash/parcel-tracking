import { app } from "./app.ts";

const port =  process.env.PORT || 8280

const server = app.listen(port, () =>{
    console.log(`Backend listening on http://localhost:${port}`);
    
})