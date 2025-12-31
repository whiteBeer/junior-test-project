import { IUser } from "../types/global";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { promisify } from "node:util";

const UserSchema = new mongoose.Schema<IUser>({
    fullName: {
        type: String,
        required: [true, "Please provide full name"],
        minlength: [3, "must be at least 3 characters"],
        maxlength: [150, "cannot be more than 150 characters"]
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "should be an email address"
        ],
        index: { unique: true }
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        minlength: [8, "must be at least 8 characters"],
        match: [
            /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
            "should be at least a symbol, upper and lower case letters and a number"
        ]
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin"]
    },
    status: {
        type: String,
        required: true,
        enum: ["active", "inactive"]
    }
}, { versionKey: false });

UserSchema.pre("save", async function () {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = async function () {
    const promisifiedSign = promisify(jwt.sign);
    const token = await promisifiedSign(
        { userId: this._id, name: this.fullName },
        // @ts-expect-error some types mismatching after promisify
        process.env.JWT_SECRET as string,
        {
            expiresIn: process.env.JWT_LIFETIME || "1h"
        }
    );
    return token;
};

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
