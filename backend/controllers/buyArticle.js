var buyArticleModel = require('../models/buyArticle.js');

/**
 * buyArticleController.js
 *
 * @description :: Server-side logic for managing buyArticles.
 */
module.exports = {

    /**
     * buyArticleController.list()
     */
    list: function (req, res) {
        buyArticleModel.find(function (err, buyArticles) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting buyArticle.',
                    error: err
                });
            }

            return res.json(buyArticles);
        });
    },

    /**
     * buyArticleController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        buyArticleModel.findOne({_id: id}, function (err, buyArticle) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting buyArticle.',
                    error: err
                });
            }

            if (!buyArticle) {
                return res.status(404).json({
                    message: 'No such buyArticle'
                });
            }

            return res.json(buyArticle);
        });
    },

    /**
     * buyArticleController.create()
     */
    create: function (req, res) {
        var buyArticle = new buyArticleModel({
			name : req.body.name,
			person : req.body.person,
			isPurchased : req.body.isPurchased
        });

        buyArticle.save(function (err, buyArticle) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating buyArticle',
                    error: err
                });
            }

            return res.status(201).json(buyArticle);
        });
    },

    /**
     * buyArticleController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        buyArticleModel.findOne({_id: id}, function (err, buyArticle) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting buyArticle',
                    error: err
                });
            }

            if (!buyArticle) {
                return res.status(404).json({
                    message: 'No such buyArticle'
                });
            }

            buyArticle.name = req.body.name ? req.body.name : buyArticle.name;
			buyArticle.person = req.body.person ? req.body.person : buyArticle.person;
			buyArticle.isPurchased = req.body.isPurchased ? req.body.isPurchased : buyArticle.isPurchased;
			
            buyArticle.save(function (err, buyArticle) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating buyArticle.',
                        error: err
                    });
                }

                return res.json(buyArticle);
            });
        });
    },

    /**
     * buyArticleController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        buyArticleModel.findByIdAndRemove(id, function (err, buyArticle) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the buyArticle.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
