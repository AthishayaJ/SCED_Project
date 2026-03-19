const mongoose = require('mongoose');

const Todo_Schema = mongoose.Schema({
    title:{ 
        type: String,
        required : true,
    },

    description: {
        type :String,
        default : "",
    },
    
    deadline : {
        type : Date,
        required : true,
    },

    priority : String,
    
    user_email: {
        type: String,
        required: true,
    },
    reminder_24_sent: {
        type: Boolean,
        default: false,
    },
    reminder_12_sent: {
        type: Boolean,
        default: false,
    },
    reminder_1_sent: {
        type: Boolean,
        default: false,
    },
    reminder_failed_count: {
        type: Number,
        default: 0,
    },
},{
    timestamps : true
}
)

module.exports = mongoose.model("Todo",Todo_Schema);