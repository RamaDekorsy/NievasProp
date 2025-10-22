import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  type: { type: String, enum: ['casa', 'departamento', 'terreno', 'local'], required: true }
}, { timestamps: true });

export const Property = mongoose.model('Property', propertySchema);

