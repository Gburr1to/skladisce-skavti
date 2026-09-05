var ShelfModel = require('../models/shelfModel.js');

/**
 * shelfController.js
 *
 * @description :: Server-side logic for managing shelfs.
 */
module.exports = {

    /**
     * shelfController.list()
     */
    list: function (req, res) {
        ShelfModel.find(function (err, shelfs) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting shelf.',
                    error: err
                });
            }

            return res.json(shelfs);
        });
    },

    /**
     * shelfController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        ShelfModel.findOne({_id: id}, function (err, shelf) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting shelf.',
                    error: err
                });
            }

            if (!shelf) {
                return res.status(404).json({
                    message: 'No such shelf'
                });
            }

            return res.json(shelf);
        });
    },

    /**
     * shelfController.create()
     */
    create: function (req, res) {
        var shelf = new ShelfModel({
			name : req.body.name,
			location : req.body.location,
			picture : req.body.picture
        });

        shelf.save(function (err, shelf) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating shelf',
                    error: err
                });
            }

            return res.status(201).json(shelf);
        });
    },

    /**
     * shelfController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        ShelfModel.findOne({_id: id}, function (err, shelf) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting shelf',
                    error: err
                });
            }

            if (!shelf) {
                return res.status(404).json({
                    message: 'No such shelf'
                });
            }

            shelf.name = req.body.name ? req.body.name : shelf.name;
			shelf.location = req.body.location ? req.body.location : shelf.location;
			shelf.picture = req.body.picture ? req.body.picture : shelf.picture;
			
            shelf.save(function (err, shelf) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating shelf.',
                        error: err
                    });
                }

                return res.json(shelf);
            });
        });
    },

    /**
     * shelfController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        ShelfModel.findByIdAndRemove(id, function (err, shelf) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the shelf.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
