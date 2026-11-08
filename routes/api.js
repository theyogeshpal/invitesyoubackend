import express from 'express';
import multer from 'multer';
import ImageKit from 'imagekit';
import { Template } from '../models/Template.js';
import { Order } from '../models/Order.js';
import { Contact } from '../models/Contact.js';
import { Invitation } from '../models/Invitation.js';

const router = express.Router();

// ────────────────────────────────
// IMAGEKIT SETUP & UPLOAD ROUTE
// ────────────────────────────────
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_RgoYoRJp5WMXFlYmZQg7rAn3pkQ=',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_bgLQuSVui0msORiDGE9uebjsBdw=',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/typ1309'
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// POST /api/upload - Upload file to ImageKit
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const folder = req.body.folder || '/digital-cards';
        const cleanName = (req.file.originalname || 'card-image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${cleanName}`;

        const result = await imagekit.upload({
            file: req.file.buffer,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true
        });

        res.json({
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            thumbnailUrl: result.thumbnailUrl
        });
    } catch (error) {
        console.error('ImageKit upload error:', error);
        res.status(500).json({ message: error.message || 'Image upload failed' });
    }
});

// ────────────────────────────────
// TEMPLATES / DIGITAL CARDS
// ────────────────────────────────

// GET all templates / digital cards (with optional filters)
router.get('/templates', async (req, res) => {
    try {
        const filter = {};
        if (req.query.tier && req.query.tier.toLowerCase() !== 'all') {
            filter.tier = new RegExp(`^${req.query.tier}$`, 'i');
        }
        if (req.query.category && req.query.category.toLowerCase() !== 'all') {
            filter.category = new RegExp(`^${req.query.category}$`, 'i');
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        const templates = await Template.find(filter).sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single template / digital card
router.get('/templates/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper to normalize template body
function parseTemplateBody(body) {
    const data = { ...body };
    if (typeof data.features === 'string') {
        data.features = data.features.split(',').map(f => f.trim()).filter(Boolean);
    }
    if (data.price) data.price = Number(data.price);
    if (data.discountedPrice) data.discountedPrice = Number(data.discountedPrice);
    return data;
}

// POST create digital card / template
router.post('/templates', async (req, res) => {
    try {
        const payload = parseTemplateBody(req.body);
        const template = new Template(payload);
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update digital card / template
router.put('/templates/:id', async (req, res) => {
    try {
        const payload = parseTemplateBody(req.body);
        const template = await Template.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE digital card / template
router.delete('/templates/:id', async (req, res) => {
    try {
        await Template.findByIdAndDelete(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ────────────────────────────────
// ORDERS
// ────────────────────────────────

// GET all orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('templateId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create order
router.post('/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update order status
router.put('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('templateId');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE order
router.delete('/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ────────────────────────────────
// CONTACTS
// ────────────────────────────────

// GET all contacts
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create contact
router.post('/contacts', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(201).json({ message: 'Message sent successfully!', contact });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ────────────────────────────────
// SEED DATA
// ────────────────────────────────
export const DEFAULT_TEMPLATES = [
    {
        title: 'Divine Temple Cinematic Card',
        tier: 'Platinum',
        category: 'Wedding',
        badge: 'Bestseller',
        price: 3999,
        discountedPrice: 4999,
        demoUrl: 'view.html?tmpl=t1&event=Wedding&names=Kabir+%26+Ananya&date=2026-12-18&time=19:00&vname=The+Leela+Palace&vaddr=Udaipur,+Rajasthan&sub=Royal+Heritage+Celebration',
        imageBack: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1543883665-27a36c646b5a?auto=format&fit=crop&w=600&q=80',
        description: 'Exquisite cinematic digital card with opening wax-seal envelope, temple bells, Google Maps, RSVP & countdown.',
        features: ['Interactive 3D Envelope', 'Background Music', 'RSVP via WhatsApp', 'Google Maps Navigation', 'Live Countdown Timer'],
        whatsappMsg: 'Hi! I want to order the "Divine Temple Cinematic Card" digital invitation.',
        status: 'Active'
    },
    {
        title: 'Royal Traditional Shlok Card',
        tier: 'Platinum',
        category: 'Wedding',
        badge: 'Trending',
        price: 3499,
        discountedPrice: 4499,
        demoUrl: 'view.html?tmpl=t1&event=Wedding&names=Pooja+%26+Arvind&date=2026-11-20&time=19:00&vname=Utsav+Marriage+Hall&vaddr=Banda+Road,+Uttar+Pradesh&sub=A+Sacred+Union+of+Hearts',
        imageBack: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
        description: 'Authentic Vedic aesthetic card with personalized shloks, couple monogram, floral animations, and event itineraries.',
        features: ['Vedic Shlokas & Mantras', 'Gold Foil Theme', 'Multi-day Event Itinerary', 'Google Maps Link', 'WhatsApp RSVP'],
        whatsappMsg: 'Hi! I want to order the "Royal Traditional Shlok Card" digital invitation.',
        status: 'Active'
    },
    {
        title: 'Royal Punjabi Anand Karaj',
        tier: 'Platinum',
        category: 'Wedding',
        badge: 'Featured',
        price: 3999,
        discountedPrice: 4999,
        demoUrl: 'view.html?tmpl=t2&event=Wedding&names=Manpreet+%26+Jaspreet&date=2026-11-22&time=10:00&vname=Grand+Gurudwara+Sahib&vaddr=Amritsar,+Punjab&sub=Satnam+Waheguru+•+Anand+Karaj',
        imageBack: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',
        description: 'Blessed Anand Karaj invitation card featuring Ik Onkar, royal burgundy velvet texture, Gurudwara map and RSVP.',
        features: ['Ik Onkar Wax Seal', 'Velvet Burgundy Theme', 'Event Itinerary Cards', 'Google Maps Location', 'RSVP via WhatsApp'],
        whatsappMsg: 'Hi! I want to order the "Royal Punjabi Anand Karaj" digital invitation.',
        status: 'Active'
    },
    {
        title: 'Elegant Ring Ceremony Card',
        tier: 'Gold',
        category: 'Engagement',
        badge: 'Popular',
        price: 2499,
        discountedPrice: 2999,
        demoUrl: 'view.html?tmpl=t2&event=Engagement&names=Rohan+%26+Meera&date=2026-12-05&time=18:30&vname=Taj+Santacruz&vaddr=Mumbai,+Maharashtra&sub=Together+We+Begin+Our+Forever',
        imageBack: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
        description: 'Rose-gold minimalist engagement card with ring motif, photo slider, RSVP, and calendar sync.',
        features: ['Rose Gold Sparkles', 'Interactive Envelope Open', 'Save to Google Calendar', 'Venue Directions', 'Direct RSVP'],
        whatsappMsg: 'Hi! I want to order the "Elegant Ring Ceremony Card" digital invitation.',
        status: 'Active'
    },
    {
        title: 'Magical Kids Birthday Bash',
        tier: 'Gold',
        category: 'Birthday',
        badge: 'New',
        price: 1999,
        discountedPrice: 2499,
        demoUrl: 'view.html?tmpl=t4&event=Birthday&names=Aarav%27s+5th+Birthday&date=2026-10-15&time=17:00&vname=Funky+Monkey+Playzone&vaddr=Bandra+West,+Mumbai&sub=Join+us+for+Fun,+Games+%26+Cake!',
        imageBack: 'https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=600&q=80',
        description: 'Vibrant party card with floating confetti, celebration music, venue navigation, and quick WhatsApp RSVP.',
        features: ['Celebration Chimes & Music', 'Party Confetti Effect', 'Live Countdown Timer', 'Venue Map', 'Kid Photo Placeholder'],
        whatsappMsg: 'Hi! I want to order the "Magical Kids Birthday Bash" digital invitation.',
        status: 'Active'
    },
    {
        title: 'Minimalist Baby Shower Card',
        tier: 'Silver',
        category: 'Baby Shower',
        badge: 'Classic',
        price: 1299,
        discountedPrice: 1799,
        demoUrl: 'view.html?tmpl=t3&event=Baby+Shower&names=Baby+Kapoor&date=2026-11-30&time=16:00&vname=The+Verandah+Lawn&vaddr=Vasant+Kunj,+New+Delhi&sub=Celebrating+a+Little+Bundle+of+Joy',
        imageBack: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80',
        imageFront: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80',
        description: 'Clean emerald pastel card with serene typography, blessings quote, Google Maps, and easy one-click RSVP.',
        features: ['Botanical Emerald Theme', 'Audio Chime Player', 'Venue Location Pins', 'Easy Sharing Link', 'WhatsApp RSVP'],
        whatsappMsg: 'Hi! I want to order the "Minimalist Baby Shower Card" digital invitation.',
        status: 'Active'
    }
];

export async function seedInitialData() {
    const count = await Template.countDocuments();
    if (count === 0) {
        await Template.insertMany(DEFAULT_TEMPLATES);
        console.log(`✨ Seeded ${DEFAULT_TEMPLATES.length} digital invitation cards automatically.`);
    }
}

router.post('/seed', async (req, res) => {
    try {
        await Template.deleteMany({});
        const templates = await Template.insertMany(DEFAULT_TEMPLATES);
        // Also seed default wedding invitation for Manpreet & Jaspreet
        await Invitation.deleteMany({});
        await Invitation.create({
            slug: 'manpreet-weds-jaspreet',
            clientName: 'Manpreet Singh',
            clientPhone: '9876543210',
            templateId: 'anand-karaj',
            waxInitials: 'M & J',
            religiousSymbol: 'ੴ',
            headerText: 'SATNAM WAHEGURU • ANAND KARAJ',
            subHeader: 'WEDDING INVITATION',
            names: 'Manpreet & Jaspreet',
            groomName: 'Manpreet Dhillon',
            groomParents: 'Son of Sardar Harvinder Singh Dhillon & Sardarni Harjeet Kaur Dhillon',
            groomInitial: 'M',
            brideName: 'Jaspreet Dhillon',
            brideParents: 'Daughter of Sardar Jaswant Singh Dhillon & Sardarni Surinder Kaur Dhillon',
            brideInitial: 'J',
            date: '2026-11-22',
            dateDisplay: 'Sunday, 22 November 2026',
            time: '10:00 AM - 01:00 PM',
            venueName: 'Grand Gurudwara Sahib',
            venueCity: 'Amritsar, Punjab',
            mapUrl: 'https://maps.google.com/?q=Grand+Gurudwara+Sahib+Amritsar',
            events: [{
                eventName: 'Sri Anand Karaj',
                dateText: 'Sunday, 22 November 2026',
                timeText: '10.00 AM - 01.00 PM',
                venue: 'Grand Gurudwara Sahib, Amritsar, Punjab',
                mapUrl: 'https://maps.google.com/?q=Grand+Gurudwara+Sahib+Amritsar',
                badgeNum: '03'
            }],
            status: 'Active'
        });

        // Seed Pooja & Arvind wedding invitation
        await Invitation.create({
            slug: 'pooja-weds-arvind',
            clientName: 'The Kushwaha Family',
            clientPhone: '9876543211',
            templateId: 'coastal-wedding',
            waxInitials: 'P & A',
            religiousSymbol: '卐',
            headerText: 'THE KUSHWAHA FAMILY',
            subHeader: 'INVITES YOU TO CELEBRATE THE WEDDING OF',
            names: 'Pooja & Arvind',
            brideName: 'Pooja Singh',
            brideParents: 'Daughter of Smt. & Shri Singh',
            brideInitial: 'P',
            groomName: 'Arvind Kumar',
            groomParents: 'Son of Smt. & Shri Kumar',
            groomInitial: 'A',
            date: '2026-11-20',
            dateDisplay: 'Friday, 20 November 2026',
            time: '07:00 PM Onwards',
            venueName: 'Utsav Marriage Hall',
            venueCity: 'Atarra, Banda, Uttar Pradesh',
            venueAddr: 'Behind Police Chauki, Banda Road, Atarra, Banda, Uttar Pradesh',
            mapUrl: 'https://maps.google.com/?q=Utsav+marriage+hall+behind+police+chauki+Banda+Road+Atarra+Banda+Uttar+Pradesh',
            events: [
                { eventName: 'Mandap', dateText: 'Wednesday, 18 Nov 2026', timeText: '10:00 AM Onwards', venue: 'Utsav Marriage Hall' },
                { eventName: 'Matrikapujan', dateText: 'Thursday, 19 Nov 2026', timeText: '11:00 AM Onwards', venue: 'Utsav Marriage Hall' },
                { eventName: 'Wedding Ceremony', dateText: 'Friday, 20 Nov 2026', timeText: '07:00 PM Onwards', venue: 'Utsav Marriage Hall' },
                { eventName: 'Vidayi', dateText: 'Saturday, 21 Nov 2026', timeText: '09:00 AM Onwards', venue: 'Utsav Marriage Hall' }
            ],
            coupleLogo: 'assets/images/couple-logo-pa.png',
            status: 'Active'
        });

        res.json({ message: `Seeded ${templates.length} templates and wedding invitations successfully!` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// STATS for dashboard
router.get('/stats', async (req, res) => {
    try {
        const totalTemplates  = await Template.countDocuments();
        const totalOrders     = await Order.countDocuments();
        const totalContacts   = await Contact.countDocuments();
        const totalInvitations = await Invitation.countDocuments();
        const revenue = await Order.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        res.json({
            totalTemplates,
            totalOrders,
            totalContacts,
            totalInvitations,
            revenue: revenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ────────────────────────────────
// INVITATIONS
// ────────────────────────────────

// GET all invitations
router.get('/invitations', async (req, res) => {
    try {
        const invitations = await Invitation.find().sort({ createdAt: -1 });
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single invitation

// GET invitation by slug
router.get('/invitations/slug/:slug', async (req, res) => {
    try {
        const inv = await Invitation.findOne({ slug: req.params.slug.toLowerCase().trim() });
        if (!inv) return res.status(404).json({ message: 'Invitation not found' });
        inv.viewCount = (inv.viewCount || 0) + 1;
        await inv.save();
        res.json(inv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/invitations/:id', async (req, res) => {
    try {
        const inv = await Invitation.findById(req.params.id);
        if (!inv) return res.status(404).json({ message: 'Invitation not found' });
        res.json(inv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create invitation (admin creates for client)
router.post('/invitations', async (req, res) => {
    try {
        let slug = req.body.slug ? req.body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
        if (!slug && req.body.names) {
            slug = req.body.names.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (!slug) slug = 'invite-' + Date.now();
        
        let existing = await Invitation.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
        }
        
        const inv = new Invitation({ ...req.body, slug });
        await inv.save();
        res.status(201).json(inv);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update invitation
router.put('/invitations/:id', async (req, res) => {
    try {
        const inv = await Invitation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!inv) return res.status(404).json({ message: 'Invitation not found' });
        res.json(inv);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE invitation
router.delete('/invitations/:id', async (req, res) => {
    try {
        await Invitation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invitation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;