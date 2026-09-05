var express = require('express');
var router = express.Router();
var closetController = require('../controllers/closetController.js');

/*
 * GET
 */
router.get('/', closetController.list);

/*
 * GET
 */
router.get('/:id', closetController.show);

/*
 * POST
 */
router.post('/', closetController.create);

/*
 * PUT
 */
router.put('/:id', closetController.update);

/*
 * DELETE
 */
router.delete('/:id', closetController.remove);

module.exports = router;
