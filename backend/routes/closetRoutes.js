const express = require('express');
const router = express.Router();
const closetController = require('../controllers/closetController.js');

/**
 * @swagger
 * tags:
 *   name: Closets
 *   description: Upravljanje omar v skladišču
 */

/**
 * @swagger
 * /closet:
 *   get:
 *     summary: Vrne seznam vseh omar
 *     tags: [Closets]
 *     responses:
 *       200:
 *         description: Seznam vseh omar
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *                   picture:
 *                     type: string
 */
router.get('/', closetController.list);

/**
 * @swagger
 * /closet/{id}:
 *   get:
 *     summary: Vrne posamezno omaro po ID-ju
 *     tags: [Closets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID omare
 *     responses:
 *       200:
 *         description: Podatki o omari
 *       404:
 *         description: Omara ne obstaja
 */
router.get('/:id', closetController.show);

/**
 * @swagger
 * /closet/{id}/shelves:
 *   get:
 *     summary: Vrne seznam vseh polic v določeni omari
 *     tags: [Closets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID omare
 *     responses:
 *       200:
 *         description: Seznam polic znotraj te omare
 *       500:
 *         description: Napaka na strežniku
 */
router.get('/:id/shelves', closetController.shelves);

/**
 * @swagger
 * /closet:
 *   post:
 *     summary: Ustvari novo omaro
 *     tags: [Closets]
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
 *                 example: "Omara za šotore"
 *               location:
 *                 type: string
 *                 example: "Glavno skladišče - desno"
 *               picture:
 *                 type: string
 *                 example: "https://example.com/slika-omare.jpg"
 *     responses:
 *       201:
 *         description: Omara uspešno ustvarjena
 *       500:
 *         description: Napaka pri ustvarjanju
 */
router.post('/', closetController.create);

/**
 * @swagger
 * /closet/{id}:
 *   put:
 *     summary: Posodobi obstoječo omaro
 *     tags: [Closets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID omare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               picture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Omara posodobljena
 *       404:
 *         description: Omara ne obstaja
 */
router.put('/:id', closetController.update);

/**
 * @swagger
 * /closet/{id}:
 *   delete:
 *     summary: Izbriše omaro
 *     tags: [Closets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID omare
 *     responses:
 *       200:
 *         description: Omara uspešno izbrisana
 *       404:
 *         description: Omara ne obstaja
 */
router.delete('/:id', closetController.remove);

module.exports = router;
