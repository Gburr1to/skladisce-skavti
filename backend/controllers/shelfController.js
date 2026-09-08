const ShelfModel = require('../models/shelfModel.js');
const ArticleModel = require('../models/articleModel.js');

module.exports = {
    /**
     * Vrne seznam vseh polic (s podatki o pripadajoči omari)
     */
    list: async function (req, res) {
        try {
            const shelves = await ShelfModel.find().populate('closet').sort({ name: 1 });
            return res.json(shelves);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju polic.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezno polico po ID-ju
     */
    show: async function (req, res) {
        try {
            const shelf = await ShelfModel.findById(req.params.id).populate('closet');
            if (!shelf) {
                return res.status(404).json({ message: 'Polica ne obstaja.' });
            }
            return res.json(shelf);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju police.',
                error: err.message
            });
        }
    },

    /**
     * Vrne seznam vseh artiklov na določeni polici
     */
    articles: async function (req, res) {
        try {
            const articles = await ArticleModel.find({ shelf: req.params.id }).sort({ name: 1 });
            return res.json(articles);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju artiklov za to polico.',
                error: err.message
            });
        }
    },

    /**
     * Ustvari novo polico
     */
    create: async function (req, res) {
        try {
            const shelf = new ShelfModel({
                name: req.body.name,
                description: req.body.description || '',
                location: req.body.location || '',
                picture: req.body.picture || '',
                closet: req.body.closet || null
            });
            const savedShelf = await shelf.save();
            const populatedShelf = await ShelfModel.findById(savedShelf._id).populate('closet');
            return res.status(201).json(populatedShelf);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju police.',
                error: err.message
            });
        }
    },

    /**
     * Posodobi polico
     */
    update: async function (req, res) {
        try {
            const updatedShelf = await ShelfModel.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    description: req.body.description,
                    location: req.body.location,
                    picture: req.body.picture,
                    closet: req.body.closet
                },
                { new: true, runValidators: true }
            ).populate('closet');

            if (!updatedShelf) {
                return res.status(404).json({ message: 'Polica ne obstaja.' });
            }
            return res.json(updatedShelf);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju police.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše polico
     */
    remove: async function (req, res) {
        try {
            const deletedShelf = await ShelfModel.findByIdAndDelete(req.params.id);
            if (!deletedShelf) {
                return res.status(404).json({ message: 'Polica ne obstaja.' });
            }
            return res.status(200).json({ message: 'Polica uspešno izbrisana.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju police.',
                error: err.message
            });
        }
    }
};
