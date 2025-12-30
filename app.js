require("dotenv").config()

const helmet = require("helmet")
const cors = require("cors")
const { xss } = require("express-xss-sanitizer")
const rateLimiter = require("express-rate-limit")

// Swagger
const swaggerUI = require("swagger-ui-express")
const YAML = require("yamljs")
const swaggerDocument = YAML.load("./swagger.yaml")

const express = require("express")
const app = express()

const authRouter = require("./routes/auth")
const usersRouter = require("./routes/users")

const notFoundMiddleware = require("./middleware/not-found")
const errorHandlerMiddleware = require("./middleware/error-handler")
const authenticationUser = require("./middleware/authentication.js")

app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }))
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())

const connectDB = require("./db/connect")

app.use("/api/swagger", swaggerUI.serve, swaggerUI.setup(swaggerDocument))

// routes
app.get("/", (req, res) => res.send("Eskov Sergey's test project <a href='/api/swagger'>API</a>"))
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", authenticationUser, usersRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 3000

const start = async () => {
    try {
        let mongoURL = process.env.MONGO_URI
        await connectDB(mongoURL)
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        )
    } catch (error) {
        console.log(error)
    }
}

start()

module.exports = { app }
