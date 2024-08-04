const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

// Helper function to handle multer errors
const handleMulterError = (err, res) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            err.message = 'File size is too large. Maximum filesize is 5MB.';
        }
        console.error(`Multer error: ${err.message}`);
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        console.error(`Unexpected error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a category by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category retrieved successfully.", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new category with image upload
router.post('/', asyncHandler(async (req, res) => {
    uploadCategory.single('img')(req, res, async (err) => {
        if (err) return handleMulterError(err, res);

        const { name } = req.body;
        let imageUrl = 'no_url';
        if (req.file) {
            imageUrl = `https://api-node-mart.vercel.app/image/category/${req.file.filename}`;
        }

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        try {
            const newCategory = new Category({ name, image: imageUrl });
            await newCategory.save();
            res.json({ success: true, message: "Category created successfully." });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
}));

// Update a category
router.put('/:id', asyncHandler(async (req, res) => {
    uploadCategory.single('img')(req, res, async (err) => {
        if (err) return handleMulterError(err, res);

        const { name } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = `https://api-node-mart.vercel.app/category/${req.file.filename}`;
        }

        if (!name || !image) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        try {
            const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { name, image }, { new: true });
            if (!updatedCategory) {
                return res.status(404).json({ success: false, message: "Category not found." });
            }
            res.json({ success: true, message: "Category updated successfully." });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
}));

// Delete a category
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        // Check if any subcategories or products reference this category
        const subcategories = await SubCategory.find({ categoryId: categoryID });
        const products = await Product.find({ proCategoryId: categoryID });

        if (subcategories.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Subcategories are referencing it." });
        }

        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Products are referencing it." });
        }

        // Delete the category if no references exist
        const category = await Category.findByIdAndDelete(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        res.json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
