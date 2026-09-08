const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController.js');

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Upravljanje artiklov in opreme v skladišču
 */

/**
 * @swagger
 * /article:
 *   get:
 *     summary: Vrne seznam vseh artiklov
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Seznam artiklov s podatki o polici in omari
 */
router.get('/', articleController.list);

/**
 * @swagger
 * /article/search:
 *   get:
 *     summary: Iskanje artiklov po nazivu, opisu ali QR kodi
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Iskalni niz (npr. 'sekira', 'šotor', 'SKAVT-...')
 *     responses:
 *       200:
 *         description: Rezultati iskanja s točno lokacijo (polica in omara)
 */
router.get('/search', articleController.search);

/**
 * @swagger
 * /article/qr/{code}:
 *   get:
 *     summary: Poišče artikel po QR kodi (skeniranje s kamero)
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: QR koda artikla
 *     responses:
 *       200:
 *         description: Podatki o artiklu
 *       404:
 *         description: Artikel s to QR kodo ne obstaja
 */
router.get('/qr/:code', articleController.getByQR);

/**
 * @swagger
 * /article/{id}:
 *   get:
 *     summary: Vrne artikel po ID-ju
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID artikla
 *     responses:
 *       200:
 *         description: Podatki o artiklu
 *       404:
 *         description: Artikel ne obstaja
 */
router.get('/:id', articleController.show);

/**
 * @swagger
 * /article:
 *   post:
 *     summary: Ustvari nov artikel (samodejno zgenerira QR kodo, če ni podana)
 *     tags: [Articles]
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
 *                 example: "Velika sekira Fiskars"
 *               description:
 *                 type: string
 *                 example: "Sekira za sekanje drv za tabor"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               shelf:
 *                 type: string
 *                 description: ID police
 *                 example: "65e8a1f2b4c1234567890abc"
 *               picture:
 *                 type: string
 *                 example: "https://example.com/sekira.jpg"
 *               qr:
 *                 type: string
 *                 description: Po meri določena QR koda (če pustiš prazno, se generira avtomatsko)
 *     responses:
 *       201:
 *         description: Artikel uspešno ustvarjen z generirano QR kodo
 */
router.post('/', articleController.create);

/**
 * @swagger
 * /article/{id}/generate-qr:
 *   post:
 *     summary: Ponovno generira unikatno QR kodo za obstoječi artikel
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID artikla
 *     responses:
 *       200:
 *         description: Nova QR koda in slika uspešno generirani
 */
router.post('/:id/generate-qr', articleController.generateQR);

/**
 * @swagger
 * /article/{id}:
 *   put:
 *     summary: Posodobi artikel
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID artikla
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
 *               quantity:
 *                 type: number
 *               shelf:
 *                 type: string
 *               picture:
 *                 type: string
 *               qr:
 *                 type: string
 *     responses:
 *       200:
 *         description: Artikel posodobljen
 *       404:
 *         description: Artikel ne obstaja
 */
router.put('/:id', articleController.update);

/**
 * @swagger
 * /article/{id}:
 *   delete:
 *     summary: Izbriše artikel
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID artikla
 *     responses:
 *       200:
 *         description: Artikel uspešno izbrisan
 *       404:
 *         description: Artikel ne obstaja
 */
router.delete('/:id', articleController.remove);

module.exports = router;
