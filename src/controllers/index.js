import { Property } from '../models/index.js';

export const getProperties = async (req, res, next) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) { next(err); }
};

export const createProperty = async (req, res, next) => {
  const { title, description, price, location, type } = req.body;
  if (!title || !description || !price || !location || !type) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const newProperty = new Property({ title, description, price, location, type });
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (err) { next(err); }
};
