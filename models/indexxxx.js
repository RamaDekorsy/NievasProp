import mongoose from 'mongoose';

// Define the Property schema
const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['casa', 'departamento', 'terreno', 'local'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Define the User schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }]
});

// Create models
const Property = mongoose.model('Property', propertySchema);
const User = mongoose.model('User', userSchema);

// Export models
export { Property, User };