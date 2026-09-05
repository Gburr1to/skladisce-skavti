var express = require('express');
var router = express.Router();
var shelfController = require('../controllers/shelfController.js');

/**
 * @swagger
*  /shelf/
* get:
*   summary: Retrieves all shelves
* 
* 
 */
router.get('/', shelfController.list);

/**
 * @swagger
 * /shelf/profile:
 *    get:
 *        summary: Retrieves the articles on this shelf
 *        tags: [Articles]
 *        description: Fetches article data for the shelf, protected by the JWT token.
 *        security:
 *            - bearerAuth: []
 *        responses:
 *            '200':
 *                description: Articles data.
 *            '401':
 *                description: Unauthorized.
 */
router.get('/:id', shelfController.show);



/*
 * POST
 */
router.post('/', shelfController.create);

/*
 * PUT
 */
router.put('/:id', shelfController.update);

/*
 * DELETE
 */
router.delete('/:id', shelfController.remove);

module.exports = router;
