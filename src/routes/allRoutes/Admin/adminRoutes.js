import express from 'express'
const router = express.Router()

console.log(" Admin routes mounted");

router.get('/test', (req, res) => {
    res.send("test route")
})

export default router