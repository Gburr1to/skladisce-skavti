const ClosetModel = require('../models/closetModel.js');
const ShelfModel = require('../models/shelfModel.js');

module.exports = {
    /**
     * Vrne seznam vseh omar
     */
    list: async function (req, res) {
        try {
            const closets = await ClosetModel.find().sort({ name: 1 });
            return res.json(closets);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju omar.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezno omaro po ID-ju
     */
    show: async function (req, res) {
        try {
            const closet = await ClosetModel.findById(req.params.id);
            if (!closet) {
                return res.status(404).json({ message: 'Omara ne obstaja.' });
            }
            return res.json(closet);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju omare.',
                error: err.message
            });
        }
    },

    /**
     * Vrne seznam polic v določeni omari (filtrirano po parent ID)
     */
    shelves: async function (req, res) {
        try {
            const shelves = await ShelfModel.find({ closet: req.params.id }).sort({ name: 1 });
            return res.json(shelves);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju polic te omare.',
                error: err.message
            });
        }
    },

    /**
     * Ustvari novo omaro
     */
    create: async function (req, res) {
        try {
            const closet = new ClosetModel({
                name: req.body.name,
                location: req.body.location || '',
                picture: req.body.picture || ''
            });
            const savedCloset = await closet.save();
            return res.status(201).json(savedCloset);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju omare.',
                error: err.message
            });
        }
    },

    /**
     * Posodobi omaro
     */
    update: async function (req, res) {
        try {
            const updatedCloset = await ClosetModel.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    location: req.body.location,
                    picture: req.body.picture
                },
                { new: true, runValidators: true }
            );
            if (!updatedCloset) {
                return res.status(404).json({ message: 'Omara ne obstaja.' });
            }
            return res.json(updatedCloset);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju omare.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše omaro
     */
    remove: async function (req, res) {
        try {
            const deletedCloset = await ClosetModel.findByIdAndDelete(req.params.id);
            if (!deletedCloset) {
                return res.status(404).json({ message: 'Omara ne obstaja.' });
            }
            return res.status(200).json({ message: 'Omara uspešno izbrisana.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju omare.',
                error: err.message
            });
        }
    }
};
