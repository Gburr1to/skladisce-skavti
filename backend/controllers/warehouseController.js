const WarehouseModel = require('../models/warehouseModel.js');
const ClosetModel = require('../models/closetModel.js');

/**
 * Pomožna funkcija: zagotovi, da vedno obstaja vsaj eno privzeto skladišče,
 * in nanj poveže vse obstoječe omare, ki še nimajo določenega skladišča.
 */
async function ensureDefaultWarehouse() {
    try {
        let count = await WarehouseModel.countDocuments();
        if (count === 0) {
            const defaultWarehouse = new WarehouseModel({
                name: 'Skladišče',
                location: '',
                description: 'Privzeto skladišče opreme'
            });
            await defaultWarehouse.save();

            // Vse obstoječe omare brez skladišča povežemo z novim privzetim skladiščem
            await ClosetModel.updateMany(
                { $or: [{ warehouse: null }, { warehouse: { $exists: false } }] },
                { warehouse: defaultWarehouse._id }
            );
            return defaultWarehouse;
        }
    } catch (err) {
        console.warn('Opozorilo pri inicializaciji privzetega skladišča:', err.message);
    }
}

module.exports = {
    /**
     * Vrne seznam vseh skladišč (če ni nobenega, avtomatsko ustvari privzeto)
     */
    list: async function (req, res) {
        try {
            await ensureDefaultWarehouse();
            const warehouses = await WarehouseModel.find().sort({ createdAt: 1 });
            return res.json(warehouses);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju skladišč.',
                error: err.message
            });
        }
    },

    /**
     * Vrne posamezno skladišče po ID-ju
     */
    show: async function (req, res) {
        try {
            const warehouse = await WarehouseModel.findById(req.params.id);
            if (!warehouse) {
                return res.status(404).json({ message: 'Skladišče ne obstaja.' });
            }
            return res.json(warehouse);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri iskanju skladišča.',
                error: err.message
            });
        }
    },

    /**
     * Vrne seznam vseh omar v določenem skladišču
     */
    closets: async function (req, res) {
        try {
            const warehouseId = req.params.id;
            const closets = await ClosetModel.find({
                $or: [
                    { warehouse: warehouseId },
                    // Če je skladišče prvo/edino, zajamemo tudi morebitne stare omare z null
                    { warehouse: null }
                ]
            }).sort({ name: 1 });
            return res.json(closets);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju omar za to skladišče.',
                error: err.message
            });
        }
    },

    /**
     * Ustvari novo skladišče
     */
    create: async function (req, res) {
        try {
            const name = req.body.name ? req.body.name.trim() : '';
            if (!name) {
                return res.status(400).json({ message: 'Ime skladišča je obvezno.' });
            }

            const warehouse = new WarehouseModel({
                name: name,
                location: req.body.location ? req.body.location.trim() : '',
                description: req.body.description ? req.body.description.trim() : ''
            });

            const savedWarehouse = await warehouse.save();
            return res.status(201).json(savedWarehouse);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju skladišča.',
                error: err.message
            });
        }
    },

    /**
     * Posodobi podatke skladišča
     */
    update: async function (req, res) {
        try {
            const updated = await WarehouseModel.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    location: req.body.location,
                    description: req.body.description
                },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ message: 'Skladišče ne obstaja.' });
            }
            return res.json(updated);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri posodabljanju skladišča.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše skladišče (morebitne omare se premaknejo v preostalo skladišče)
     */
    remove: async function (req, res) {
        try {
            const total = await WarehouseModel.countDocuments();
            if (total <= 1) {
                return res.status(400).json({ message: 'Zadnjega skladišča ni mogoče izbrisati.' });
            }

            const remainingWarehouse = await WarehouseModel.findOne({ _id: { $ne: req.params.id } });
            if (remainingWarehouse) {
                await ClosetModel.updateMany(
                    { warehouse: req.params.id },
                    { warehouse: remainingWarehouse._id }
                );
            }

            const deleted = await WarehouseModel.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Skladišče ne obstaja.' });
            }
            return res.json({ message: 'Skladišče uspešno izbrisano.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri brisanju skladišča.',
                error: err.message
            });
        }
    }
};
