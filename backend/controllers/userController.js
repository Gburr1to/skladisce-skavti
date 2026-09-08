const UserModel = require('../models/userModel.js');
const KeyHolderModel = require('../models/keyHolderModel.js');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.ACCES_TOKEN_SECRET || 'skavti_skladisce_tajni_kljuc_2026';

module.exports = {
    /**
     * Vrne seznam imetnikov ključa skladišča.
     * POMEMBNO (TODO kriterij): Vrne zgolj tabelo imen (string array), ne modelov/objektov.
     * Npr. ["Janez Novak", "Micka Kovač", "Luka Skavt"]
     */
    listKeyHolders: async function (req, res) {
        try {
            const holders = await KeyHolderModel.find().sort({ name: 1 });
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
     * Doda ime na seznam imetnikov ključa
     */
    addKeyHolder: async function (req, res) {
        try {
            const name = req.body.name ? req.body.name.trim() : '';
            if (!name) {
                return res.status(400).json({ message: 'Ime je obvezno.' });
            }

            await KeyHolderModel.findOneAndUpdate(
                { name: name },
                { name: name },
                { upsert: true, new: true }
            );

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
     * Odstrani ime s seznama imetnikov ključa
     */
    removeKeyHolder: async function (req, res) {
        try {
            const name = req.params.name;
            await KeyHolderModel.findOneAndDelete({ name: name });
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

            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30m' });
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
