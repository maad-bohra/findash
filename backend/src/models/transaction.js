const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,   
        required: true  
    },
    category: {
        type: String,
        required: true,
        enum: ['Transport', 'Income', 'Entertainment', 'Food', 'Other','Bills']  
    },
    status: {
        type: String,
        required: true,
        enum: ['Completed', 'Pending', 'Failed']
    },
    amount: {
        type: Number,
        required: true
     
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);