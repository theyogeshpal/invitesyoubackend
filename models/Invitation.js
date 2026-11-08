import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
    // Unique slug for the invitation URL (e.g. "manpreet-weds-jaspreet")
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    templateId:  { type: String, default: 'anand-karaj' },

    // Client info (admin record)
    clientName:  { type: String, required: true },
    clientPhone: { type: String, default: '' },

    // Wax seal & header
    waxInitials:     { type: String, default: 'M & J' },
    religiousSymbol: { type: String, default: 'ੴ' },
    headerText:      { type: String, default: 'SATNAM WAHEGURU • ANAND KARAJ' },
    subHeader:       { type: String, default: 'WEDDING INVITATION' },

    // Couple Names
    names:       { type: String, required: true, default: 'Manpreet & Jaspreet' },
    subtitle:    { type: String, default: 'Beginning of Forever' },

    // Groom Details
    groomName:    { type: String, default: 'Manpreet Dhillon' },
    groomParents: { type: String, default: 'Son of Sardar Harvinder Singh Dhillon & Sardarni Harjeet Kaur Dhillon' },
    groomInitial: { type: String, default: 'M' },

    // Bride Details
    brideName:    { type: String, default: 'Jaspreet Dhillon' },
    brideParents: { type: String, default: 'Daughter of Sardar Jaswant Singh Dhillon & Sardarni Surinder Kaur Dhillon' },
    brideInitial: { type: String, default: 'J' },

    // Date & Countdown
    date:        { type: String, default: '2026-11-22' },           // YYYY-MM-DD
    dateDisplay: { type: String, default: 'Sunday, 22 November 2026' },
    time:        { type: String, default: '10:00 AM - 01:00 PM' },
    venueName:   { type: String, default: 'Grand Gurudwara Sahib' },
    venueCity:   { type: String, default: 'Amritsar, Punjab' },
    mapUrl:      { type: String, default: 'https://maps.google.com/?q=Amritsar+Punjab' },

    // Function/Events list
    events: [{
        eventName: { type: String, default: 'Sri Anand Karaj' },
        dateText:  { type: String, default: 'Sunday, 22 November 2026' },
        timeText:  { type: String, default: '10.00 AM - 01.00 PM' },
        venue:     { type: String, default: 'Grand Gurudwara Sahib, Amritsar, Punjab' },
        mapUrl:    { type: String, default: 'https://maps.google.com/?q=Amritsar+Punjab' },
        badgeNum:  { type: String, default: '03' }
    }],

    // Theme & Options
    theme:       { type: String, default: 'anand-karaj' },
    whatsappMsg: { type: String, default: 'Hi! I want to order this digital invitation.' },
    whatsappNumber: { type: String, default: '917817095043' },
    musicUrl:    { type: String, default: '' },
    shareUrl:    { type: String, default: '' },
    status:      { type: String, default: 'Active', enum: ['Active', 'Sent', 'Expired'] },
    viewCount:   { type: Number, default: 0 },
}, { timestamps: true });

export const Invitation = mongoose.model('Invitation', InvitationSchema);
