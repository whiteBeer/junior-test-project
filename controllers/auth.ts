import { IUser, IErrorMongoose } from "../types/global";
import { Request, Response } from "express";
import User from "../models/User";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";

const withoutPassword = (user:IUser) => {
    const {password, ...userWithoutPassword} = user.toObject();
    return userWithoutPassword;
};

const register = async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        throw new BadRequestError("Please provide name, email, and password");
    }

    try {
        const user = await User.create({
            ...req.body,
            ...{role: "user", status: "active"}
        });
        const token = await user.createJWT();
        res.status(StatusCodes.CREATED).json({ user: withoutPassword(user), token });
    } catch (err:unknown) {
        const knownError = err as IErrorMongoose;
        if (knownError.code === 11000) {
            throw new BadRequestError("Email already exists");
        } else {
            throw err;
        }
    }
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError("Please provide email and password");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new UnauthenticatedError("Invalid credentials");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid credentials");
    }

    const token = await user.createJWT();
    res.status(StatusCodes.OK).json({ user: withoutPassword(user), token });
};

export {
    register,
    login
};
