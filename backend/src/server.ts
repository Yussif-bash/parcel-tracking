import express  from "express";

const app = express()

const port =  process.env.PORT || 8280

app.get("/health", (_req, res) =>{
    res.status(200).json({status: "Ok"})
})

app.use((_req, res)=> {
    res.status(404).json({error: "Not Found"})
})

const server = app.listen(port, () =>{
    console.log(`Backend listening on http://localhost:${port}`);
    
})