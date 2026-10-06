const UserModel = require('../models/userModel.js');
const KeyHolderModel = require('../models/keyHolderModel.js');
const KeyHolderConfigModel = require('../models/keyHolderConfigModel.js');
const jwt = require('jsonwebtoken');
const { requireJwtSecret } = require('../config/auth.js');
const mongoose = require('mongoose');

/**
 * Pomožna funkcija za preverjanje varnostnega gesla za imetnike ključa
 */
async function verifyKeyHolderAuth(providedPassword) {
    try {
        const config = await KeyHolderConfigModel.findOne();
        if (!config || !config.isConfigured || !config.password) {
            return true;
        }
        if (!providedPassword) {
            return false;
        }
        return String(providedPassword).trim() === String(config.password).trim();
    } catch {
        return false;
    }
}

/**
 * Pomožna funkcija za maskiranje e-poštnega naslova
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) {
        return `${name[0]}*@${domain}`;
    }
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

module.exports = {
    /**
     * Vrne seznam imetnikov ključa skladišča.
     * Podpira filtriranje po skladišču in detailed=true za polne objekte.
     * Če detailed ni določen, zaradi združljivosti vrne tabelo imen (string array).
     */
    listKeyHolders: async function (req, res) {
        try {
            const filter = {};
            if (req.query.warehouse && req.query.warehouse !== 'all') {
                filter.$or = [
                    { warehouse: req.query.warehouse },
                    { warehouse: null }
                ];
            }

            const isDetailed = req.query.detailed === 'true';

            if (isDetailed) {
                const holders = await KeyHolderModel.find(filter)
                    .populate('warehouse')
                    .sort({ name: 1 });
                return res.json(holders);
            }

            const holders = await KeyHolderModel.find(filter).sort({ name: 1 });
            const namesOnly = holders.map(h => h.name);
            return res.json(namesOnly);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri pridobivanju seznama imetnikov ključa.',
                error: err.message
            });
        }
    },

    /**
     * Doda imetnika na seznam (z opcijsko navezavo na skladišče).
     * Če je nastavljeno geslo, preveri avtentikacijo.
     */
    addKeyHolder: async function (req, res) {
        try {
            const name = req.body.name ? req.body.name.trim() : '';
            if (!name) {
                return res.status(400).json({ message: 'Ime je obvezno.' });
            }

            const authPass = req.body.password || req.headers['x-keyholder-password'];
            const isAuthorized = await verifyKeyHolderAuth(authPass);
            if (!isAuthorized) {
                return res.status(401).json({ message: 'Za dodajanje imetnika ključa je potrebno veljavno geslo.' });
            }

            const warehouseId = req.body.warehouse || null;
            const note = req.body.note ? String(req.body.note).trim() : '';

            // Če imetnik z istim imenom že obstaja, posodobimo njegovo skladišče/opombo, sicer ustvarimo novega
            let holder = await KeyHolderModel.findOne({ name: name });
            if (holder) {
                holder.warehouse = warehouseId;
                if (note) holder.note = note;
                await holder.save();
            } else {
                holder = new KeyHolderModel({
                    name,
                    warehouse: warehouseId,
                    note
                });
                await holder.save();
            }

            if (req.query.detailed === 'true' || req.body.detailed === true) {
                const allDetailed = await KeyHolderModel.find().populate('warehouse').sort({ name: 1 });
                return res.status(201).json(allDetailed);
            }

            const holders = await KeyHolderModel.find().sort({ name: 1 });
            return res.status(201).json(holders.map(h => h.name));
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri dodajanju imetnika ključa.',
                error: err.message
            });
        }
    },

    /**
     * Odstrani imetnika s seznama (po ID-ju ali imenu).
     * Če je nastavljeno geslo, preveri avtentikacijo.
     */
    removeKeyHolder: async function (req, res) {
        try {
            const identifier = req.params.name;
            const authPass = req.query.password || req.body.password || req.headers['x-keyholder-password'];
            const isAuthorized = await verifyKeyHolderAuth(authPass);
            if (!isAuthorized) {
                return res.status(401).json({ message: 'Za odstranitev imetnika ključa je potrebno veljavno geslo.' });
            }

            const isMongoId = mongoose.Types.ObjectId.isValid(identifier);
            if (isMongoId) {
                await KeyHolderModel.findByIdAndDelete(identifier);
            } else {
                await KeyHolderModel.findOneAndDelete({ name: identifier });
            }

            if (req.query.detailed === 'true') {
                const allDetailed = await KeyHolderModel.find().populate('warehouse').sort({ name: 1 });
                return res.json(allDetailed);
            }

            const holders = await KeyHolderModel.find().sort({ name: 1 });
            return res.json(holders.map(h => h.name));
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri odstranjevanju imetnika ključa.',
                error: err.message
            });
        }
    },

    /**
     * Vrne trenutni status varnostne konfiguracije (brez gesla v odgovoru)
     */
    getKeyHolderConfig: async function (req, res) {
        try {
            const config = await KeyHolderConfigModel.findOne();
            if (!config || !config.isConfigured) {
                return res.json({
                    isConfigured: false,
                    recoveryEmailMasked: ''
                });
            }
            return res.json({
                isConfigured: true,
                recoveryEmailMasked: maskEmail(config.recoveryEmail)
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri branju konfiguracije varnosti.',
                error: err.message
            });
        }
    },

    /**
     * Začetna nastavitev gesla in obnovitvenega Gmaila s strani vodje
     */
    setupKeyHolderConfig: async function (req, res) {
        try {
            const { password, recoveryEmail } = req.body;
            if (!password || !password.trim()) {
                return res.status(400).json({ message: 'Geslo je obvezno.' });
            }
            if (!recoveryEmail || !recoveryEmail.trim() || !recoveryEmail.includes('@')) {
                return res.status(400).json({ message: 'Veljaven Gmail naslov je obvezen.' });
            }

            let config = await KeyHolderConfigModel.findOne();
            if (config && config.isConfigured) {
                return res.status(400).json({ message: 'Geslo je že nastavljeno. Uporabite spremembo ali ponastavitev.' });
            }

            if (!config) {
                config = new KeyHolderConfigModel();
            }

            config.password = password.trim();
            config.recoveryEmail = recoveryEmail.trim().toLowerCase();
            config.isConfigured = true;
            await config.save();

            return res.status(201).json({
                message: 'Varnostno geslo in obnovitveni naslov uspešno nastavljena.',
                isConfigured: true,
                recoveryEmailMasked: maskEmail(config.recoveryEmail)
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri nastavitvi konfiguracije.',
                error: err.message
            });
        }
    },

    /**
     * Preveri veljavnost vnesenega gesla
     */
    verifyKeyHolderPassword: async function (req, res) {
        try {
            const { password } = req.body;
            const config = await KeyHolderConfigModel.findOne();
            if (!config || !config.isConfigured) {
                return res.json({ valid: true });
            }

            const valid = String(password || '').trim() === String(config.password).trim();
            if (!valid) {
                return res.status(401).json({ valid: false, message: 'Napačno geslo.' });
            }

            return res.json({ valid: true, message: 'Geslo potrjeno.' });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri preverjanju gesla.',
                error: err.message
            });
        }
    },

    /**
     * Spremeni obnovitveni Gmail naslov (zahteva vpis trenutnega gesla)
     */
    changeKeyHolderRecoveryEmail: async function (req, res) {
        try {
            const { password, newRecoveryEmail } = req.body;
            if (!password || !newRecoveryEmail || !newRecoveryEmail.includes('@')) {
                return res.status(400).json({ message: 'Geslo in veljaven novi email sta obvezna.' });
            }

            const config = await KeyHolderConfigModel.findOne();
            if (!config || !config.isConfigured) {
                return res.status(400).json({ message: 'Varnost še ni konfigurirana.' });
            }

            if (String(password).trim() !== String(config.password).trim()) {
                return res.status(401).json({ message: 'Napačno trenutno geslo.' });
            }

            config.recoveryEmail = newRecoveryEmail.trim().toLowerCase();
            await config.save();

            return res.json({
                message: 'Obnovitveni Gmail naslov uspešno posodobljen.',
                recoveryEmailMasked: maskEmail(config.recoveryEmail)
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri spreminjanju emaila.',
                error: err.message
            });
        }
    },

    /**
     * Ponastavitev gesla z vnosom registriranega Gmail naslova (če je vodja pozabil geslo)
     */
    resetKeyHolderPassword: async function (req, res) {
        try {
            const { recoveryEmail, newPassword } = req.body;
            if (!recoveryEmail || !newPassword || !newPassword.trim()) {
                return res.status(400).json({ message: 'Gmail naslov in novo geslo sta obvezna.' });
            }

            const config = await KeyHolderConfigModel.findOne();
            if (!config || !config.isConfigured) {
                return res.status(400).json({ message: 'Varnost še ni konfigurirana.' });
            }

            const emailMatch = String(recoveryEmail).trim().toLowerCase() === String(config.recoveryEmail).trim().toLowerCase();
            if (!emailMatch) {
                return res.status(403).json({ message: 'Vneseni Gmail naslov se ne ujema z registriranim naslovom vodje.' });
            }

            config.password = newPassword.trim();
            await config.save();

            return res.json({ message: 'Geslo uspešno ponastavljeno.' });
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ponastavitvi gesla.',
                error: err.message
            });
        }
    },

    /**
     * Prijava uporabnika
     */
    login: async function (req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Uporabniško ime in geslo sta obvezna.' });
            }

            const user = await UserModel.findOne({ username });
            if (!user || user.password !== password) {
                return res.status(401).json({ message: 'Napačno uporabniško ime ali geslo.' });
            }

            const token = jwt.sign(
                { id: user._id, username: user.username },
                requireJwtSecret(),
                { expiresIn: '30m' }
            );
            return res.json({
                message: 'Prijava uspešna.',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    picture: user.picture
                }
            });
        } catch (err) {
            console.error('Login error:', err.message);
            return res.status(500).json({
                message: 'Napaka pri prijavi.',
                error: err.message
            });
        }
    },

    /**
     * Profil prijavljenega uporabnika
     */
    profile: async function (req, res) {
        try {
            const user = await UserModel.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'Uporabnik ne obstaja.' });
            }
            return res.json(user);
        } catch (err) {
            return res.status(500).json({ message: 'Napaka pri branju profila.', error: err.message });
        }
    },

    /**
     * Odjava uporabnika
     */
    logout: async function (req, res) {
        return res.json({ message: 'Odjava uspešna. Žeton odstranite na odjemalcu.' });
    },

    /**
     * Ustvari novega uporabnika (registracija)
     */
    create: async function (req, res) {
        try {
            const { username, password, picture } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: 'Uporabniško ime in geslo sta obvezna.' });
            }

            const existingUser = await UserModel.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Uporabnik s tem imenom že obstaja.' });
            }

            const user = new UserModel({
                username,
                password,
                picture: picture || ''
            });

            const savedUser = await user.save();
            const userResponse = savedUser.toObject();
            delete userResponse.password;

            return res.status(201).json(userResponse);
        } catch (err) {
            return res.status(500).json({
                message: 'Napaka pri ustvarjanju uporabnika.',
                error: err.message
            });
        }
    },

    /**
     * Izbriše uporabnika
     */
    remove: async function (req, res) {
        try {
            const deleted = await UserModel.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Uporabnik ne obstaja.' });
            }
            return res.json({ message: 'Uporabnik uspešno izbrisan.', id: req.params.id });
        } catch (err) {
            return res.status(500).json({ message: 'Napaka pri brisanju uporabnika.', error: err.message });
        }
    },

    /**
     * Seznam uporabnikov
     */
    list: async function (req, res) {
        try {
            const users = await UserModel.find({}, '-password').sort({ username: 1 });
            return res.json(users);
        } catch (err) {
            return res.status(500).json({ message: 'Napaka pri branju uporabnikov.', error: err.message });
        }
    }
};
