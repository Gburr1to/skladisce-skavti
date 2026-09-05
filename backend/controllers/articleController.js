var ArticleModel = require('../models/articleModel.js');

/**
 * articleController.js
 *
 * @description :: Server-side logic for managing articles.
 */
module.exports = {

    /**
     * articleController.list()
     */
    list: function (req, res) {
        ArticleModel.find(function (err, articles) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting article.',
                    error: err
                });
            }

            return res.json(articles);
        });
    },

    /**
     * articleController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        ArticleModel.findOne({_id: id}, function (err, article) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting article.',
                    error: err
                });
            }

            if (!article) {
                return res.status(404).json({
                    message: 'No such article'
                });
            }

            return res.json(article);
        });
    },

    /**
     * articleController.create()
     */
    create: function (req, res) {
        var article = new ArticleModel({
			name : req.body.name,
			description : req.body.description,
			qr : req.body.qr,
			picture : req.body.picture
        });

        article.save(function (err, article) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating article',
                    error: err
                });
            }

            return res.status(201).json(article);
        });
    },

    /**
     * articleController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        ArticleModel.findOne({_id: id}, function (err, article) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting article',
                    error: err
                });
            }

            if (!article) {
                return res.status(404).json({
                    message: 'No such article'
                });
            }

            article.name = req.body.name ? req.body.name : article.name;
			article.description = req.body.description ? req.body.description : article.description;
			article.qr = req.body.qr ? req.body.qr : article.qr;
			article.picture = req.body.picture ? req.body.picture : article.picture;
			
            article.save(function (err, article) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating article.',
                        error: err
                    });
                }

                return res.json(article);
            });
        });
    },

    /**
     * articleController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        ArticleModel.findByIdAndRemove(id, function (err, article) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the article.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
