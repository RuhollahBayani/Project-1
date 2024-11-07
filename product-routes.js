const express = require('express');
const router = express.Router();
const ProductModel = require('./ProductModel');

router.post(
    '/create-product',

    function(req, res){

        const newProduct = {
            "productName": req.body.productName,
            "productModel": req.body.productModel,
            "price": req.body.price,
            "properties": req.body.properties
        }

        productModel
        .create(newProduct)
        .then(
            function (newlyCreatedProduct) {
                res.send({
                    "status": "not ok",
                    "message": newlyCreatedProduct
                })

            }
        )
        .catch(
            function (dbError) {
                res.json({
                    "status": "not ok",
                    "message": "Error at /create-product"
                })
            }
        )

        //res.send("see console for data")
    }
);

module.exports = router;