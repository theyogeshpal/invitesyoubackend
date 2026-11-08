import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    tier: { type: String, required: true, enum: ['Silver', 'Gold', 'Platinum'], default: 'Gold' },
    category: { type: String, required: true, default: 'Wedding' },
    price: { type: Number, required: true },
    discountedPrice: { type: Number },
    demoUrl: { type: String, default: '' },
    imageBack: { type: String, default: '' },
    imageFront: { type: String, default: '' },
    description: { type: String, default: '' },
    features: [{ type: String }],
    whatsappMsg: { type: String, default: '' },
    badge: { type: String, default: '' }, // e.g. 'Bestseller', 'Trending', 'Hot'
    status: { type: String, enum: ['Active', 'Draft'], default: 'Active' }
}, { timestamps: true });

export const Template = mongoose.model('Template', TemplateSchema);
