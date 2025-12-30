const mongoose = require("mongoose")
const {BadRequestError} = require("../errors")

const validateParamsId = async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new BadRequestError("Invalid id parameter")
    }
    next()
}

module.exports = validateParamsId