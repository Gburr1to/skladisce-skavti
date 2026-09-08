const ArticleModel = require('../models/articleModel.js');
const QRCode = require('qrcode');

/**
 * Pomožna funkcija za generiranje edinstvene QR kode
 */
function generateUniqueQRCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SKAVT-ART-${timestamp}-${random}`;
}

module.exports = {
    /**
     * Vrne seznam vseh artiklov (s podatki o polici in omari)
     */
    list: async function (req, res) {
        try {
            const articles = await ArticleModel.find()
                .populate({
                    path: 'shelf',
                    populate: { path: 'closet' }
                })
                .sort({ name: 1 });
            return res.json(articles);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju artiklov.',
                error: err.message
            });
        }
    },

    /**
     * Iskanje artiklov po nazivu, opisu ali QR kodi.
     * Vrne artikle skupaj z informacijo o polici in omari (lokaciji).
     */
    search: async function (req, res) {
        try {
            const query = req.query.q || '';
            if (!query.trim()) {
                const all = await ArticleModel.find()
                    .populate({ path: 'shelf', populate: { path: 'closet' } })
                    .sort({ name: 1 });
                return res.json(all);
            }

            const regex = new RegExp(query.trim(), 'i');
            const articles = await ArticleModel.find({
                $or: [
                    { name: regex },
                    { description: regex },
                    { qr: regex }
                ]
            }).populate({
                path: 'shelf',
                populate: { path: 'closet' }
            });

            return res.json(articles);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju artiklov.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezen artikel po ID-ju (s podatki o polici in omari)
     */
    show: async function (req, res) {
        try {
            const article = await ArticleModel.findById(req.params.id)
                .populate({
                    path: 'shelf',
                    populate: { path: 'closet' }
                });

            if (!article) {
                return res.status(404).json({ message: 'Artikel ne obstaja.' });
            }
            return res.json(article);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju artikla.',
                error: err.message
            });
        }
    },

    /**
     * Poišče artikel po QR kodi (uporabno ob skeniranju s kamero/telefonom)
     */
    getByQR: async function (req, res) {
        try {
            const qrCode = req.params.code;
            const article = await ArticleModel.findOne({ qr: qrCode })
                .populate({
                    path: 'shelf',
                    populate: { path: 'closet' }
                });

            if (!article) {
                return res.status(404).json({ message: `Artikel s QR kodo '${qrCode}' ni bil najden.` });
            }
            return res.json(article);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju artikla po QR kodi.',
                error: err.message
            });
        }
    },

    /**
     * Ustvari nov artikel. Če QR koda ni podana, se samodejno generira edinstvena koda in slika.
     */
    create: async function (req, res) {
        try {
            const qrValue = (req.body.qr && req.body.qr.trim()) ? req.body.qr.trim() : generateUniqueQRCode();
            
            // Generiranje QR kode v Base64 Data URL
            let qrImageData = '';
            try {
                qrImageData = await QRCode.toDataURL(qrValue);
            } catch (qrErr) {
                console.warn('Opozorilo: Ni bilo mogoče zgenerirati QR slike:', qrErr.message);
            }

            const article = new ArticleModel({
                name: req.body.name,
                description: req.body.description || '',
                shelf: req.body.shelf || null,
                qr: qrValue,
                qrImage: qrImageData,
                picture: req.body.picture || '',
                quantity: req.body.quantity !== undefined ? req.body.quantity : 1
            });

            const savedArticle = await article.save();
            const populated = await ArticleModel.findById(savedArticle._id)
                .populate({ path: 'shelf', populate: { path: 'closet' } });

            return res.status(201).json(populated);
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'Artikel s to QR kodo že obstaja.' });
            }
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju artikla.',
                error: err.message
            });
        }
    },

    /**
     * Generira ali obnovi QR kodo za obstoječi artikel
     */
    generateQR: async function (req, res) {
        try {
            const article = await ArticleModel.findById(req.params.id);
            if (!article) {
                return res.status(404).json({ message: 'Artikel ne obstaja.' });
            }

            const newQR = generateUniqueQRCode();
            const qrImageData = await QRCode.toDataURL(newQR);

            article.qr = newQR;
            article.qrImage = qrImageData;
            await article.save();

            return res.json({
                message: 'QR koda uspešno ustvarjena.',
                qr: newQR,
                qrImage: qrImageData
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri generiranju QR kode.',
                error: err.message
            });
        }
    },

    /**
     * Posodobi artikel
     */
    update: async function (req, res) {
        try {
            const updateData = {
                name: req.body.name,
                description: req.body.description,
                shelf: req.body.shelf,
                picture: req.body.picture,
                quantity: req.body.quantity
            };

            // Če je uporabnik podal novo QR kodo, posodobimo tudi QR sliko
            if (req.body.qr) {
                updateData.qr = req.body.qr;
                try {
                    updateData.qrImage = await QRCode.toDataURL(req.body.qr);
                } catch (e) {
                    console.warn('Napaka pri generiranju nove QR slike:', e);
                }
            }

            const updatedArticle = await ArticleModel.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            ).populate({ path: 'shelf', populate: { path: 'closet' } });

            if (!updatedArticle) {
                return res.status(404).json({ message: 'Artikel ne obstaja.' });
            }
            return res.json(updatedArticle);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju artikla.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše artikel
     */
    remove: async function (req, res) {
        try {
            const deletedArticle = await ArticleModel.findByIdAndDelete(req.params.id);
            if (!deletedArticle) {
                return res.status(404).json({ message: 'Artikel ne obstaja.' });
            }
            return res.status(200).json({ message: 'Artikel uspešno izbrisan.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju artikla.',
                error: err.message
            });
        }
    }
};
