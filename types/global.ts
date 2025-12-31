import {Document} from "mongoose";

export interface IUser extends Document {
    fullName: string;
    email: string;
    password: string;
    role?: "user" | "admin";
    status?: "active" | "inactive";
    createJWT(): Promise<string>;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IJwtPayload {
    userId: string;
    name: string;
}