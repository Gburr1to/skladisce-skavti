var ClosetModel = require('../models/closetModel.js');

/**
 * closetController.js
 *
 * @description :: Server-side logic for managing closets.
 */
module.exports = {

    /**
     * closetController.list()
     */
    list: function (req, res) {
        ClosetModel.find(function (err, closets) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting closet.',
                    error: err
                });
            }

            return res.json(closets);
        });
    },

    /**
     * closetController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        ClosetModel.findOne({_id: id}, function (err, closet) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting closet.',
                    error: err
                });
            }

            if (!closet) {
                return res.status(404).json({
                    message: 'No such closet'
                });
            }

            return res.json(closet);
        });
    },

    /**
     * closetController.create()
     */
    create: function (req, res) {
        var closet = new ClosetModel({
			name : req.body.name,
			location : req.body.location,
			picture : req.body.picture
        });

        closet.save(function (err, closet) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating closet',
                    error: err
                });
            }

            return res.status(201).json(closet);
        });
    },

    /**
     * closetController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        ClosetModel.findOne({_id: id}, function (err, closet) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting closet',
                    error: err
                });
            }

            if (!closet) {
                return res.status(404).json({
                    message: 'No such closet'
                });
            }

            closet.name = req.body.name ? req.body.name : closet.name;
			closet.location = req.body.location ? req.body.location : closet.location;
			closet.picture = req.body.picture ? req.body.picture : closet.picture;
			
            closet.save(function (err, closet) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating closet.',
                        error: err
                    });
                }

                return res.json(closet);
            });
        });
    },

    /**
     * closetController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        ClosetModel.findByIdAndRemove(id, function (err, closet) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the closet.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
