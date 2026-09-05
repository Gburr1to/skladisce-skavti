var express = require('express');
var router = express.Router();
var buyArticleController = require('../controllers/buyArticle.js');

/*
 * GET
 */
//to pokaže vse izdelke na seznamu, kdo jih bo kupil ipd.
router.get('/', buyArticleController.list);

/*
 * GET
 */
router.get('/:id', buyArticleController.show);

/*
 * POST
 */
router.post('/', buyArticleController.create);

/*
 * PUT
 */
router.put('/:id', buyArticleController.update);

/*
 * DELETE
 */
router.delete('/:id', buyArticleController.remove);

module.exports = router;
