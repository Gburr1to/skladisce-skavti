const BuyArticleModel = require('../models/buyArticle.js');

module.exports = {
    /**
     * Vrne seznam vseh izdelkov za nakup (lahko filtrirano po kupljeno/nekupljeno)
     */
    list: async function (req, res) {
        try {
            const filter = {};
            if (req.query.purchased !== undefined) {
                filter.isPurchased = req.query.purchased === 'true';
            }
            const items = await BuyArticleModel.find(filter).sort({ createdAt: -1 });
            return res.json(items);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju nakupovalnega seznama.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezen izdelek po ID-ju
     */
    show: async function (req, res) {
        try {
            const item = await BuyArticleModel.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Artikel za nakup ne obstaja.' });
            }
            return res.json(item);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju artikla za nakup.',
                error: err.message
            });
        }
    },

    /**
     * Doda nov izdelek na nakupovalni seznam
     */
    create: async function (req, res) {
        try {
            const item = new BuyArticleModel({
                name: req.body.name,
                person: req.body.person || '',
                isPurchased: req.body.isPurchased || false
            });
            const savedItem = await item.save();
            return res.status(201).json(savedItem);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri dodajanju artikla na seznam.',
                error: err.message
            });
        }
    },

    /**
     * Preklopi ali nastavi status 'kupljeno' (isPurchased)
     */
    togglePurchased: async function (req, res) {
        try {
            const item = await BuyArticleModel.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Artikel za nakup ne obstaja.' });
            }

            if (req.body.isPurchased !== undefined) {
                item.isPurchased = req.body.isPurchased;
            } else {
                item.isPurchased = !item.isPurchased;
            }

            await item.save();
            return res.json(item);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju statusa nakupa.',
                error: err.message
            });
        }
    },

    /**
     * Posodobi izdelek na nakupovalnem seznamu
     */
    update: async function (req, res) {
        try {
            const updatedItem = await BuyArticleModel.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    person: req.body.person,
                    isPurchased: req.body.isPurchased
                },
                { new: true, runValidators: true }
            );

            if (!updatedItem) {
                return res.status(404).json({ message: 'Artikel za nakup ne obstaja.' });
            }
            return res.json(updatedItem);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju artikla.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše izdelek z nakupovalnega seznama
     */
    remove: async function (req, res) {
        try {
            const deletedItem = await BuyArticleModel.findByIdAndDelete(req.params.id);
            if (!deletedItem) {
                return res.status(404).json({ message: 'Artikel za nakup ne obstaja.' });
            }
            return res.status(200).json({ message: 'Artikel uspešno odstranjen s seznama.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju artikla.',
                error: err.message
            });
        }
    }
};
