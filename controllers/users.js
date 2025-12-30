const User = require("../models/User")
const { StatusCodes } = require("http-status-codes")
const { BadRequestError, NotFoundError } = require("../errors")

const getAllUsers = async (req, res) => {
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10

    if (req.user.role !== "admin") {
        throw new BadRequestError("Only admins can see other users")
    }

    if (skip && skip < 0 || limit && limit < 0 || isNaN(skip) || isNaN(limit)) {
        throw new BadRequestError("Incorrect skip or limit params")
    }

    const users =
        await User.find({})
            .select("-password")
            .sort("createdAt")
            .skip(skip)
            .limit(limit)

    const usersTotal = await User.countDocuments({})
    res.status(StatusCodes.OK).json({ users, total: usersTotal })
}

const getUser = async (req, res) => {
    const {
        id: userId
    } = req.params

    if (req.user.status === "inactive") {
        throw new BadRequestError("Your account is inactive")
    }

    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
        throw new BadRequestError("Only admins can see other users")
    }

    const user =
        await User.findOne({ _id: userId })
            .select("-password")

    if (!user) {
        throw new NotFoundError(`No user with id ${userId}`)
    }

    res.status(StatusCodes.OK).json({ user })
}


const blockUser = async (req, res) => {
    const {
        id: userId,
        newStatus: newStatus
    } = req.params

    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
        throw new BadRequestError("Only admins can block other users")
    }

    const existingUser = await User.findOne({ _id: userId })

    if (!existingUser) {
        throw new NotFoundError(`No user with id ${userId}`)
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId},
        { status: newStatus },
        { new: true, runValidators: true }
    )

    res.status(StatusCodes.OK).json({
        statusUpdated: updatedUser.status !== existingUser.status
    })
}

module.exports = {
    getAllUsers,
    getUser,
    blockUser
}
