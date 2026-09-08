const express = require('express');
const router = express.Router();
const buyArticleController = require('../controllers/buyArticle.js');

/**
 * @swagger
 * tags:
 *   name: Shopping
 *   description: Nakupovalni seznam (artikli za nakup)
 */

/**
 * @swagger
 * /shopping:
 *   get:
 *     summary: Vrne nakupovalni seznam (vsi izdelki za nakup)
 *     tags: [Shopping]
 *     parameters:
 *       - in: query
 *         name: purchased
 *         schema:
 *           type: boolean
 *         description: Filtriraj po statusu nakupa (true = kupljeno, false = še ni kupljeno)
 *     responses:
 *       200:
 *         description: Nakupovalni seznam
 */
router.get('/', buyArticleController.list);

/**
 * @swagger
 * /shopping/{id}:
 *   get:
 *     summary: Vrne posamezen izdelek z nakupovalnega seznama
 *     tags: [Shopping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izdelka
 *     responses:
 *       200:
 *         description: Podatki o izdelku
 *       404:
 *         description: Izdelek ne obstaja
 */
router.get('/:id', buyArticleController.show);

/**
 * @swagger
 * /shopping:
 *   post:
 *     summary: Doda nov izdelek na nakupovalni seznam
 *     tags: [Shopping]
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
 *                 example: "Baterije AA 24x"
 *               person:
 *                 type: string
 *                 example: "Janez"
 *               isPurchased:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Izdelek uspešno dodan
 */
router.post('/', buyArticleController.create);

/**
 * @swagger
 * /shopping/{id}/toggle-purchased:
 *   patch:
 *     summary: Preklopi ali nastavi status 'kupljeno' za izdelek
 *     tags: [Shopping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izdelka
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPurchased:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status uspešno posodobljen
 *       404:
 *         description: Izdelek ne obstaja
 */
router.patch('/:id/toggle-purchased', buyArticleController.togglePurchased);

/**
 * @swagger
 * /shopping/{id}:
 *   put:
 *     summary: Posodobi izdelek na nakupovalnem seznamu
 *     tags: [Shopping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izdelka
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               person:
 *                 type: string
 *               isPurchased:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Izdelek posodobljen
 *       404:
 *         description: Izdelek ne obstaja
 */
router.put('/:id', buyArticleController.update);

/**
 * @swagger
 * /shopping/{id}:
 *   delete:
 *     summary: Izbriše izdelek z nakupovalnega seznama
 *     tags: [Shopping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID izdelka
 *     responses:
 *       200:
 *         description: Izdelek uspešno izbrisan
 *       404:
 *         description: Izdelek ne obstaja
 */
router.delete('/:id', buyArticleController.remove);

module.exports = router;
