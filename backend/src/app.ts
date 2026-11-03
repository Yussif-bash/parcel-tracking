import express from "express"

export const app = express()

app.get("/health", (_req, res) => {
    res.status(200).json({status: "Ok"})
})

app.use((_req, res) => {
    res.status(404).json({error: "Not Found"})
})