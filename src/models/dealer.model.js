import mongoose from "mongoose"
const DealerSchema = mongoose.Schema({
    city: {
        type: String
    },
    state: {
        type: String
    },
    pincode: {
        type: String
    },
    branch: {
        type: String
    },
    mouValidity: {
        type: Date,
    },
}, { timestamp: true }
)
const Dealer = User.discriminator("Dealer", DealerSchema)
export default Dealer;