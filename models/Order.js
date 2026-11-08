import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    eventDetails: { type: String },
    amount: { type: Number },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Processing', 'Completed', 'Cancelled'] }
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);