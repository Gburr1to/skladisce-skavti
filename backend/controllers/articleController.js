const ArticleModel = require('../models/articleModel.js');
const ShelfModel = require('../models/shelfModel.js');
const ClosetModel = require('../models/closetModel.js');
const WarehouseModel = require('../models/warehouseModel.js');
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
            const filter = {};
            if (req.query.category && req.query.category !== 'Vse') {
                filter.category = req.query.category;
            }
            if (req.query.branch && req.query.branch !== 'Vse veje' && req.query.branch !== 'Vse') {
                filter.branch = req.query.branch;
            }
            if (req.query.shelf) {
                filter.shelf = req.query.shelf;
            }

            const articles = await ArticleModel.find(filter)
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
     * Iskanje artiklov po nazivu, opisu, kategoriji, veji ali QR kodi.
     * Vrne artikle skupaj z informacijo o polici in omari (lokaciji).
     */
    search: async function (req, res) {
        try {
            const query = req.query.q || '';
            const filter = {};

            if (req.query.category && req.query.category !== 'Vse') {
                filter.category = req.query.category;
            }
            if (req.query.branch && req.query.branch !== 'Vse veje' && req.query.branch !== 'Vse') {
                filter.branch = req.query.branch;
            }

            if (query.trim()) {
                const regex = new RegExp(query.trim(), 'i');
                filter.$or = [
                    { name: regex },
                    { description: regex },
                    { qr: regex },
                    { category: regex },
                    { branch: regex }
                ];
            }

            const articles = await ArticleModel.find(filter).populate({
                path: 'shelf',
                populate: { path: 'closet' }
            }).sort({ name: 1 });

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
                category: req.body.category || 'Razno',
                branch: req.body.branch || 'Vse veje',
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
     * Masovni uvoz artiklov (za uvoz iz Excel tabele ali CSV)
     */
    batch: async function (req, res) {
        try {
            const rawItems = Array.isArray(req.body) ? req.body : (req.body.items || []);
            if (!Array.isArray(rawItems) || rawItems.length === 0) {
                return res.status(400).json({ message: 'Seznam artiklov za uvoz je prazen.' });
            }

            // Validacija vrstic in beleženje napak
            const validationErrors = [];
            const validItems = [];

            rawItems.forEach((item, index) => {
                const rowNum = index + 2; // Vrstica v Excelu ob predpostavki, da je vrstica 1 glava
                if (!item || typeof item !== 'object') {
                    validationErrors.push(`Vrstica ${rowNum}: Neveljaven zapis podatkov.`);
                    return;
                }
                const name = item.name ? String(item.name).trim() : '';
                if (!name) {
                    validationErrors.push(`Vrstica ${rowNum}: Manjka obvezen naziv artikla.`);
                    return;
                }
                if (item.quantity !== undefined && item.quantity !== null && item.quantity !== '') {
                    const qty = Number(item.quantity);
                    if (isNaN(qty) || qty < 0) {
                        validationErrors.push(`Vrstica ${rowNum} (${name}): Neveljavna količina "${item.quantity}". Pričakovano je število >= 0.`);
                        return;
                    }
                }
                validItems.push(item);
            });

            if (validItems.length === 0) {
                return res.status(400).json({
                    message: 'Nobena vrstica v datoteki ne vsebuje veljavnih podatkov za uvoz.',
                    errors: validationErrors
                });
            }

            // Zagotovimo privzeto skladišče, če je potrebno ustvariti nove omare
            let defaultWarehouse = await WarehouseModel.findOne();
            if (!defaultWarehouse) {
                defaultWarehouse = new WarehouseModel({
                    name: 'Glavno skladišče',
                    location: 'Sedež stegnja'
                });
                await defaultWarehouse.save();
            }

            const closetCache = new Map();
            const shelfCache = new Map();

            const importedArticles = [];

            for (const item of validItems) {
                let shelfId = item.shelf || null;

                // Če ima vrstica podani imeni omare in police, poiščemo ali avtomatsko ustvarimo
                const closetName = item.closetName ? String(item.closetName).trim() : '';
                const shelfName = item.shelfName ? String(item.shelfName).trim() : '';

                if (!shelfId && closetName) {
                    let closetId = closetCache.get(closetName.toLowerCase());
                    if (!closetId) {
                        let existingCloset = await ClosetModel.findOne({ name: new RegExp(`^${closetName}$`, 'i') });
                        if (!existingCloset) {
                            existingCloset = new ClosetModel({
                                name: closetName,
                                warehouse: defaultWarehouse._id
                            });
                            await existingCloset.save();
                        }
                        closetId = existingCloset._id;
                        closetCache.set(closetName.toLowerCase(), closetId);
                    }

                    if (shelfName) {
                        const shelfKey = `${closetId}_${shelfName.toLowerCase()}`;
                        shelfId = shelfCache.get(shelfKey);
                        if (!shelfId) {
                            let existingShelf = await ShelfModel.findOne({
                                closet: closetId,
                                name: new RegExp(`^${shelfName}$`, 'i')
                            });
                            if (!existingShelf) {
                                existingShelf = new ShelfModel({
                                    name: shelfName,
                                    closet: closetId
                                });
                                await existingShelf.save();
                            }
                            shelfId = existingShelf._id;
                            shelfCache.set(shelfKey, shelfId);
                        }
                    }
                }

                const qrValue = (item.qr && String(item.qr).trim()) ? String(item.qr).trim() : generateUniqueQRCode();
                let qrImageData = '';
                try {
                    qrImageData = await QRCode.toDataURL(qrValue);
                } catch {
                    // QR slika je opcijska
                }

                const newArt = new ArticleModel({
                    name: String(item.name).trim(),
                    description: item.description ? String(item.description).trim() : '',
                    category: item.category ? String(item.category).trim() : 'Razno',
                    branch: item.branch ? String(item.branch).trim() : 'Vse veje',
                    quantity: Number(item.quantity) >= 0 ? Number(item.quantity) : 1,
                    shelf: shelfId,
                    qr: qrValue,
                    qrImage: qrImageData
                });

                const saved = await newArt.save();
                importedArticles.push(saved);
            }

            return res.status(201).json({
                message: `Uspešno uvoženih ${importedArticles.length} artiklov.${validationErrors.length > 0 ? ` Zaznanih ${validationErrors.length} napak v datoteki.` : ''}`,
                count: importedArticles.length,
                articles: importedArticles,
                errors: validationErrors
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri masovnem uvozu artiklov.',
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
                category: req.body.category,
                branch: req.body.branch,
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
