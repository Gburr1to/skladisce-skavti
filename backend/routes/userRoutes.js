const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { authenticateToken } = require('../middleware/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Uporabniki, prijava in imetniki ključa skladišča
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Prijava v sistem (vrne JWT žeton)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "skavt"
 *               password:
 *                 type: string
 *                 example: "skavt"
 *     responses:
 *       200:
 *         description: Uspešna prijava, vrne JWT žeton
 *       401:
 *         description: Napačno uporabniško ime ali geslo
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Podatki o prijavljenem uporabniku (zahteva JWT)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Podatki o uporabniku
 *       401:
 *         description: Nimate veljavnega žetona
 */
router.get('/profile', authenticateToken, userController.profile);

/**
 * @swagger
 * /users/logout:
 *   get:
 *     summary: Odjava uporabnika
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Odjava uspešna
 */
router.get('/logout', userController.logout);

/**
 * @swagger
 * /users/key-holders:
 *   get:
 *     summary: Vrne seznam imetnikov ključa (SAMO IMENA, brez objektov)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Seznam imen imetnikov ključa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Janez Novak", "Micka Kovač", "Luka Skavt"]
 */
router.get('/key-holders', userController.listKeyHolders);

/**
 * @swagger
 * /users/key-holders:
 *   post:
 *     summary: Doda novo ime na seznam imetnikov ključa
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tone Vodnik"
 *     responses:
 *       201:
 *         description: Posodobljen seznam imen imetnikov ključa
 */
router.post('/key-holders', userController.addKeyHolder);

/**
 * @swagger
 * /users/key-holders/{name}:
 *   delete:
 *     summary: Odstrani ime s seznama imetnikov ključa
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Ime osebe za odstranitev
 *     responses:
 *       200:
 *         description: Posodobljen seznam imen imetnikov ključa
 */
router.delete('/key-holders/:name', userController.removeKeyHolder);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Vrne seznam uporabnikov
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Seznam uporabnikov
 */
router.get('/', userController.list);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Ustvari novega uporabnika (registracija)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "nov_skavt"
 *               password:
 *                 type: string
 *                 example: "skavtisozakon123"
 *               picture:
 *                 type: string
 *                 example: "https://example.com/slika.jpg"
 *     responses:
 *       201:
 *         description: Uporabnik uspešno ustvarjen
 *       400:
 *         description: Manjkajoči podatki ali uporabnik že obstaja
 */
router.post('/', userController.create);
router.post('/register', userController.create);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Izbriše uporabnika
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID uporabnika
 *     responses:
 *       200:
 *         description: Uporabnik uspešno izbrisan
 *       404:
 *         description: Uporabnik ne obstaja
 */
router.delete('/:id', userController.remove);

module.exports = router;
