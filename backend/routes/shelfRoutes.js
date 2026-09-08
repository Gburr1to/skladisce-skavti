const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController.js');

/**
 * @swagger
 * tags:
 *   name: Shelves
 *   description: Upravljanje polic v skladišču
 */

/**
 * @swagger
 * /shelf:
 *   get:
 *     summary: Vrne seznam vseh polic
 *     tags: [Shelves]
 *     responses:
 *       200:
 *         description: Seznam vseh polic skupaj s podatki o omari
 */
router.get('/', shelfController.list);

/**
 * @swagger
 * /shelf/{id}:
 *   get:
 *     summary: Vrne posamezno polico po ID-ju
 *     tags: [Shelves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID police
 *     responses:
 *       200:
 *         description: Podatki o polici
 *       404:
 *         description: Polica ne obstaja
 */
router.get('/:id', shelfController.show);

/**
 * @swagger
 * /shelf/{id}/articles:
 *   get:
 *     summary: Vrne seznam vseh artiklov na tej polici
 *     tags: [Shelves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID police
 *     responses:
 *       200:
 *         description: Seznam artiklov na polici
 */
router.get('/:id/articles', shelfController.articles);

/**
 * @swagger
 * /shelf:
 *   post:
 *     summary: Ustvari novo polico
 *     tags: [Shelves]
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
 *                 example: "Zgornja polica A1"
 *               description:
 *                 type: string
 *                 example: "Spalne vreče, samonapihljive podloge in termo odeje"
 *               location:
 *                 type: string
 *                 example: "Višina 180cm"
 *               picture:
 *                 type: string
 *                 example: "https://example.com/polica.jpg"
 *               closet:
 *                 type: string
 *                 description: ID omare, v kateri se nahaja polica
 *                 example: "65e8a1f2b4c1234567890abc"
 *     responses:
 *       201:
 *         description: Polica uspešno ustvarjena
 */
router.post('/', shelfController.create);

/**
 * @swagger
 * /shelf/{id}:
 *   put:
 *     summary: Posodobi polico
 *     tags: [Shelves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID police
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 example: "Spalne vreče, samonapihljive podloge in termo odeje"
 *               location:
 *                 type: string
 *               picture:
 *                 type: string
 *               closet:
 *                 type: string
 *     responses:
 *       200:
 *         description: Polica posodobljena
 *       404:
 *         description: Polica ne obstaja
 */
router.put('/:id', shelfController.update);

/**
 * @swagger
 * /shelf/{id}:
 *   delete:
 *     summary: Izbriše polico
 *     tags: [Shelves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID police
 *     responses:
 *       200:
 *         description: Polica uspešno izbrisana
 *       404:
 *         description: Polica ne obstaja
 */
router.delete('/:id', shelfController.remove);

module.exports = router;
