import dotenv from "dotenv";
dotenv.config();

import helmet from "helmet";
import cors from "cors";
import { xss } from "express-xss-sanitizer";
import rateLimiter from "express-rate-limit";

import authRouter from "./routes/auth";
import usersRouter from "./routes/users";

// Swagger
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
const swaggerDocument = YAML.load("./swagger.yaml");

import express, { Request, Response } from "express";

import notFoundMiddleware from "./middleware/not-found";
import errorHandlerMiddleware from "./middleware/error-handler";
import authenticationUser from "./middleware/authentication";

import connectDB from "./db/connect";

const app = express();

app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.use("/api/swagger", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// routes
app.get("/", (req: Request, res: Response) => {
    res.send("Eskov Sergey's test project <a href='/api/swagger'>API</a>");
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", authenticationUser, usersRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined");
        }
        await connectDB(mongoURI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();

export { app };
