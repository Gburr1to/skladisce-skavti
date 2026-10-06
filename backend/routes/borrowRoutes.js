const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController.js');

/**
 * @swagger
 * tags:
 *   name: Borrow
 *   description: Upravljanje izposoj opreme in artiklov
 */

/**
 * @swagger
 * /borrow:
 *   get:
 *     summary: Vrne seznam vseh izposoj (lahko filtrirano po statusu ali artiklu)
 *     tags: [Borrow]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned]
 *         description: Status izposoje
 *       - in: query
 *         name: articleId
 *         schema:
 *           type: string
 *         description: Filtriraj po ID-ju artikla
 *     responses:
 *       200:
 *         description: Seznam izposoj s podatki o artiklu in lokaciji
 */
router.get('/', borrowController.list);

/**
 * @swagger
 * /borrow/{id}:
 *   get:
 *     summary: Vrne posamezno izposojo po ID-ju
 *     tags: [Borrow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izposoje
 *     responses:
 *       200:
 *         description: Podatki o izposoji
 *       404:
 *         description: Zapis o izposoji ne obstaja
 */
router.get('/:id', borrowController.show);

/**
 * @swagger
 * /borrow:
 *   post:
 *     summary: Ustvari novo izposojo artikla (avtomatsko zmanjša zalogo v skladišču)
 *     tags: [Borrow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - articleId
 *               - person
 *             properties:
 *               articleId:
 *                 type: string
 *                 description: ID artikla, ki si ga izposojamo
 *                 example: "65e8a1f2b4c1234567890abc"
 *               quantity:
 *                 type: number
 *                 default: 1
 *                 example: 2
 *               person:
 *                 type: string
 *                 example: "Luka Novak"
 *               purpose:
 *                 type: string
 *                 example: "Zimovanje Pohorje"
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-15"
 *     responses:
 *       201:
 *         description: Izposoja uspešno ustvarjena
 *       400:
 *         description: Neveljavni podatki ali premalo artiklov na zalogi
 *       404:
 *         description: Artikel ne obstaja
 */
router.post('/', borrowController.create);

/**
 * @swagger
 * /borrow/{id}/return:
 *   patch:
 *     summary: Označi izposojo kot vrnjeno (avtomatsko povrne zalogo artikla v skladišču)
 *     tags: [Borrow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izposoje
 *     responses:
 *       200:
 *         description: Artikel uspešno vrnjen v skladišče
 *       400:
 *         description: Artikel je bil že vrnjen
 *       404:
 *         description: Izposoja ne obstaja
 */
router.patch('/:id/return', borrowController.returnBorrow);

/**
 * @swagger
 * /borrow/{id}:
 *   delete:
 *     summary: Izbriše zapis o izposoji (odrabljeno/uničeno ali čiščenje evidence)
 *     tags: [Borrow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izposoje
 *     responses:
 *       200:
 *         description: Izposoja uspešno izbrisana
 *       404:
 *         description: Izposoja ne obstaja
 */
router.delete('/:id', borrowController.remove);

module.exports = router;
