import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import connectToDb from './src/db/index.js';
import mainRouter from './src/routes/index.js'
import { asyncHandler } from './src/utils/AsyncHandler.js';
dotenv.config();

const port = process.env.PORT
const app = express()

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send("test route")
})

app.use('/anteso', mainRouter)
app.use(asyncHandler);

const startServer = async () => {
    try {
        await connectToDb()
        app.listen(port, () => {
            console.log(`server running on ${port}`);
        })
    } catch (error) {
        console.log("MONGO db connection failed !!! ", error);
    }
}
startServer();