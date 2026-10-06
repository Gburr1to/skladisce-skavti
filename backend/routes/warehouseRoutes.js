const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController.js');

/**
 * @swagger
 * tags:
 *   name: Warehouse
 *   description: Upravljanje skladišč (lokacij)
 */

/**
 * @swagger
 * /warehouse:
 *   get:
 *     summary: Vrne seznam vseh skladišč
 *     tags: [Warehouse]
 *     responses:
 *       200:
 *         description: Seznam skladišč
 */
router.get('/', warehouseController.list);

/**
 * @swagger
 * /warehouse/{id}:
 *   get:
 *     summary: Vrne posamezno skladišče po ID-ju
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID skladišča
 *     responses:
 *       200:
 *         description: Podatki o skladišču
 *       404:
 *         description: Skladišče ne obstaja
 */
router.get('/:id', warehouseController.show);

/**
 * @swagger
 * /warehouse/{id}/closets:
 *   get:
 *     summary: Vrne seznam omar v določenem skladišču
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID skladišča
 *     responses:
 *       200:
 *         description: Seznam omar v tem skladišču
 */
router.get('/:id/closets', warehouseController.closets);

/**
 * @swagger
 * /warehouse:
 *   post:
 *     summary: Ustvari novo skladišče
 *     tags: [Warehouse]
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
 *                 example: "Glavno skladišče"
 *               location:
 *                 type: string
 *                 example: "Klet župnišča"
 *               description:
 *                 type: string
 *                 example: "Skladišče za opremo vodov in taborov"
 *     responses:
 *       201:
 *         description: Skladišče uspešno ustvarjeno
 *       400:
 *         description: Neveljavni podatki
 */
router.post('/', warehouseController.create);

/**
 * @swagger
 * /warehouse/{id}:
 *   put:
 *     summary: Posodobi podatke skladišča
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID skladišča
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skladišče posodobljeno
 *       404:
 *         description: Skladišče ne obstaja
 */
router.put('/:id', warehouseController.update);

/**
 * @swagger
 * /warehouse/{id}:
 *   delete:
 *     summary: Izbriše skladišče (če jih je več kot 1)
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID skladišča
 *     responses:
 *       200:
 *         description: Skladišče uspešno izbrisano
 *       400:
 *         description: Zadnjega skladišča ni mogoče izbrisati
 *       404:
 *         description: Skladišče ne obstaja
 */
router.delete('/:id', warehouseController.remove);

module.exports = router;
