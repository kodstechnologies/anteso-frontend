import mongoose from "mongoose"
const DealerSchema = mongoose.Schema({
    branch: {
        type: String
    },
    mouValidity: {
        type: Date,
    },
}, { timestamp: true }
)
const Dealer = User.discriminator("Dealer", DealerSchema)
export default Dealer;+