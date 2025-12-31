import { Request, Response } from "express";
import User from "../models/User";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../errors";

const getAllUsers = async (req: Request, res: Response) => {
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (skip < 0 || limit < 1 || isNaN(skip) || isNaN(limit)) {
        throw new BadRequestError("Incorrect skip or limit params");
    }

    const users =
        await User.find({})
            .select("-password")
            .sort("createdAt")
            .skip(skip)
            .limit(limit);

    const usersTotal = await User.countDocuments({});
    res.status(StatusCodes.OK).json({ users, total: usersTotal });
};

const getUser = async (req: Request, res: Response) => {
    const {
        id: userId
    } = req.params;

    if (req?.user?.status === "inactive") {
        throw new BadRequestError("Your account is inactive");
    }

    const user =
        await User.findOne({ _id: userId })
            .select("-password");

    if (!user) {
        throw new NotFoundError(`No user with id ${userId}`);
    }

    res.status(StatusCodes.OK).json({ user });
};

const blockUser = async (req: Request, res: Response) => {
    const {
        id: userId,
        newStatus: newStatus
    } = req.params;

    const existingUser = await User.findOne({ _id: userId });

    if (!existingUser) {
        throw new NotFoundError(`No user with id ${userId}`);
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId},
        { status: newStatus },
        { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
        isStatusUpdated: updatedUser && updatedUser.status !== existingUser.status
    });
};

export {
    getAllUsers,
    getUser,
    blockUser
};
