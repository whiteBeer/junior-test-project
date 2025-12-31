import request from "supertest";
import { app } from "../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe("Auth Endpoints", () => {
    describe("POST /api/v1/auth/register", () => {
        it("1. should register a new user and return a valid token with userId and name", async () => {
            const userData = {
                fullName: "Test User",
                email: "test@example.com",
                password: "Password123!"
            };

            const res = await request(app)
                .post("/api/v1/auth/register")
                .send(userData);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user.fullName).toEqual(userData.fullName);
            expect(res.body).toHaveProperty("token");

            const decoded = jwt.decode(res.body.token) as { userId: string, name: string };
            
            expect(decoded).toBeTruthy();
            expect(decoded).toHaveProperty("userId");
            expect(typeof decoded.userId).toBe("string");
            expect(decoded).toHaveProperty("name", userData.fullName);
        });

        it("2. should not register a user with existing email", async () => {
            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    fullName: "Test User",
                    email: "test@example.com",
                    password: "Password123!"
                });

            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    fullName: "Test User 2",
                    email: "test@example.com",
                    password: "Password123!"
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.msg).toEqual("Email already exists");
        });

        it("3. should validate input fields", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    fullName: "",
                    email: "invalid-email",
                    password: "123"
                });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        beforeEach(async () => {
            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    fullName: "Test User",
                    email: "test@example.com",
                    password: "Password123!"
                });
        });

        it("4. should login and return a valid token with userId and name", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "test@example.com",
                    password: "Password123!"
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.user.fullName).toEqual("Test User");
            expect(res.body).toHaveProperty("token");

            const decoded = jwt.decode(res.body.token) as { userId: string, name: string };
            
            expect(decoded).toBeTruthy();
            expect(decoded).toHaveProperty("userId");
            expect(typeof decoded.userId).toBe("string");
            expect(decoded).toHaveProperty("name", "Test User");
        });

        it("5. should not login with incorrect password", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "test@example.com",
                    password: "WrongPassword123!"
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.msg).toEqual("Invalid credentials");
        });

        it("6. should not login with non-existent email", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "nonexistent@example.com",
                    password: "Password123!"
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.msg).toEqual("Invalid credentials");
        });
    });
});
