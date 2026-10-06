const BorrowModel = require('../models/borrowModel.js');
const ArticleModel = require('../models/articleModel.js');

module.exports = {
    /**
     * Vrne seznam vseh izposoj (lahko filtrirano po statusu ali ID-ju artikla)
     */
    list: async function (req, res) {
        try {
            const filter = {};
            if (req.query.status) {
                filter.status = req.query.status;
            }
            if (req.query.articleId) {
                filter.article = req.query.articleId;
            }

            const borrows = await BorrowModel.find(filter)
                .populate({
                    path: 'article',
                    populate: {
                        path: 'shelf',
                        populate: { path: 'closet' }
                    }
                })
                .sort({ createdAt: -1 });

            return res.json(borrows);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju seznama izposoj.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezno izposojo po ID-ju
     */
    show: async function (req, res) {
        try {
            const borrow = await BorrowModel.findById(req.params.id)
                .populate({
                    path: 'article',
                    populate: {
                        path: 'shelf',
                        populate: { path: 'closet' }
                    }
                });

            if (!borrow) {
                return res.status(404).json({ message: 'Zapis o izposoji ne obstaja.' });
            }
            return res.json(borrow);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju izposoje.',
                error: err.message
            });
        }
    },

    /**
     * Ustvari novo izposojo:
     * - preveri zalogo artikla
     * - zmanjša quantity na artiklu
     * - ustvari nov zapis v zbirki Borrow
     */
    create: async function (req, res) {
        try {
            const articleId = req.body.articleId || req.body.article;
            if (!articleId) {
                return res.status(400).json({ message: 'ID artikla je obvezen.' });
            }

            const person = req.body.person ? req.body.person.trim() : '';
            if (!person) {
                return res.status(400).json({ message: 'Ime prevzemnika je obvezno.' });
            }

            const quantity = Number(req.body.quantity) || 1;
            if (quantity <= 0) {
                return res.status(400).json({ message: 'Količina mora biti večja od 0.' });
            }

            const article = await ArticleModel.findById(articleId);
            if (!article) {
                return res.status(404).json({ message: 'Artikel ne obstaja.' });
            }

            if (article.quantity < quantity) {
                return res.status(400).json({
                    message: `Na voljo je le ${article.quantity} kosov.`
                });
            }

            // Zmanjšamo zalogo artikla v skladišču
            article.quantity -= quantity;
            await article.save();

            const borrow = new BorrowModel({
                article: article._id,
                articleName: article.name,
                quantity: quantity,
                person: person,
                purpose: req.body.purpose ? req.body.purpose.trim() : '',
                returnDate: req.body.returnDate || null,
                borrowDate: req.body.borrowDate || new Date(),
                status: 'active'
            });

            const savedBorrow = await borrow.save();
            const populated = await BorrowModel.findById(savedBorrow._id)
                .populate({
                    path: 'article',
                    populate: {
                        path: 'shelf',
                        populate: { path: 'closet' }
                    }
                });

            const result = populated.toObject();
            result.updatedArticle = article;

            return res.status(201).json(result);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju izposoje.',
                error: err.message
            });
        }
    },

    /**
     * Vrne artikel nazaj v skladišče:
     * - označi izposojo kot 'returned'
     * - vrne količino nazaj v zalogo artikla
     */
    returnBorrow: async function (req, res) {
        try {
            const borrow = await BorrowModel.findById(req.params.id);
            if (!borrow) {
                return res.status(404).json({ message: 'Zapis o izposoji ne obstaja.' });
            }

            if (borrow.status === 'returned') {
                return res.status(400).json({ message: 'Ta artikel je že bil vrnjen.' });
            }

            // Povečamo zalogo na artiklu nazaj
            let updatedArticle = null;
            if (borrow.article) {
                updatedArticle = await ArticleModel.findById(borrow.article);
                if (updatedArticle) {
                    updatedArticle.quantity += borrow.quantity;
                    await updatedArticle.save();
                }
            }

            borrow.status = 'returned';
            borrow.returnedAt = new Date();
            await borrow.save();

            const populated = await BorrowModel.findById(borrow._id)
                .populate({
                    path: 'article',
                    populate: {
                        path: 'shelf',
                        populate: { path: 'closet' }
                    }
                });

            const result = populated.toObject();
            result.updatedArticle = updatedArticle;

            return res.json(result);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri vračilu artikla.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše zapis o izposoji (uporabno ob uničenem/odrabljenem artiklu ali čiščenju evidence)
     */
    remove: async function (req, res) {
        try {
            const deleted = await BorrowModel.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Zapis o izposoji ne obstaja.' });
            }
            return res.status(200).json({
                message: 'Izposoja uspešno izbrisana.',
                id: req.params.id
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju zapisa izposoje.',
                error: err.message
            });
        }
    }
};
