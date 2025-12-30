const User = require("../models/User")
const { StatusCodes } = require("http-status-codes")
const { BadRequestError, UnauthenticatedError, NotFoundError } = require("../errors")

const register = async (req, res) => {
    const { fullName, email, password } = req.body
    if (!fullName || !email || !password) {
        throw new BadRequestError("Please provide name, email, and password")
    }

    try {
        const user = await User.create({
            ...req.body,
            ...{role: "user", status: "active"}
        })
        const token = await user.createJWT()
        res.status(StatusCodes.CREATED).json({
            user: { name: user.fullName, status: user.status, role: user.role },
            token
        })
    } catch (err) {
        if (err.code === 11000) {
            throw new BadRequestError("Email already exists")
        } else {
            throw err
        }
    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new BadRequestError("Please provide email and password")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new UnauthenticatedError("Invalid credentials")
    }

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid credentials")
    }

    const token = await user.createJWT()
    res.status(StatusCodes.OK).json({ user: {
        fullName: user.fullName, status: user.status, role: user.role
    }, token })
}

module.exports = {
    register,
    login
}
