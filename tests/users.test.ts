import request from "supertest";
import { app } from "../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User";

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

describe("Users Endpoints", () => {
    let adminToken: string;
    let userToken: string;
    let adminId: string;
    let userId: string;

    beforeEach(async () => {
        const admin = await User.create({
            fullName: "Admin User",
            email: "admin@example.com",
            password: "Password123!",
            role: "admin",
            status: "active"
        });
        adminId = admin._id.toString();
        adminToken = await admin.createJWT();

        const user = await User.create({
            fullName: "Regular User",
            email: "user@example.com",
            password: "Password123!",
            role: "user",
            status: "active"
        });
        userId = user._id.toString();
        userToken = await user.createJWT();
    });

    describe("GET /api/v1/users", () => {
        it("1. should allow admin to get all users", async () => {
            const res = await request(app)
                .get("/api/v1/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("users");
            expect(Array.isArray(res.body.users)).toBeTruthy();
            expect(res.body.users.length).toBeGreaterThanOrEqual(2);
        });

        it("2. should NOT allow regular user to get all users", async () => {
            const res = await request(app)
                .get("/api/v1/users")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.msg).toEqual("Access denied");
        });

        it("3. should fail without token", async () => {
            const res = await request(app)
                .get("/api/v1/users");

            expect(res.statusCode).toEqual(401);
        });
    });

    describe("GET /api/v1/users/:id", () => {
        it("4. should allow admin to get any user profile", async () => {
            const res = await request(app)
                .get(`/api/v1/users/${userId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user).toHaveProperty("_id", userId);
        });

        it("5. should allow user to get their own profile", async () => {
            const res = await request(app)
                .get(`/api/v1/users/${userId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user).toHaveProperty("_id", userId);
        });

        it("6. should NOT allow user to get another user's profile", async () => {
            const res = await request(app)
                .get(`/api/v1/users/${adminId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.msg).toEqual("Access denied");
        });

        it("7. should return 404 for non-existent user", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/users/${nonExistentId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(404);
        });

        it("8. should return 400 for invalid ID format", async () => {
            const res = await request(app)
                .get("/api/v1/users/invalid-id")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(400);
        });
    });

    describe("POST /api/v1/users/:id/:newStatus", () => {
        it("9. should allow admin to block a user", async () => {
            const res = await request(app)
                .post(`/api/v1/users/${userId}/inactive`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.isStatusUpdated).toBe(true);

            const updatedUser = await User.findById(userId);
            expect(updatedUser?.status).toBe("inactive");
        });

        it("10. should allow admin to unblock a user", async () => {
            await User.findByIdAndUpdate(userId, { status: "inactive" });

            const res = await request(app)
                .post(`/api/v1/users/${userId}/active`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.isStatusUpdated).toBe(true);
            
            const updatedUser = await User.findById(userId);
            expect(updatedUser?.status).toBe("active");
        });

        it("11. should allow regular user to block himself", async () => {
            const res = await request(app)
                .post(`/api/v1/users/${userId}/inactive`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.isStatusUpdated).toBe(true);
            const updatedUser = await User.findById(userId);
            expect(updatedUser?.status).toBe("inactive");
        });

        it("12. should allow regular user to unblock himself", async () => {
            await User.findByIdAndUpdate(userId, { status: "inactive" });
            const res = await request(app)
                .post(`/api/v1/users/${userId}/active`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.isStatusUpdated).toBe(true);
            const updatedUser = await User.findById(userId);
            expect(updatedUser?.status).toBe("active");
        });

        it("13. should NOT allow regular user to change status of another user", async () => {
            const res = await request(app)
                .post(`/api/v1/users/${adminId}/inactive`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.msg).toEqual("Access denied");
        });
    });
});
