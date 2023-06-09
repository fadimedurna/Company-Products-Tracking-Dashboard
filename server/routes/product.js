const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Company = require("../models/Company");

// GET ALL Products
router.get("/", async (req, res) => {
  const { skip, limit, search, sort, companyId } = req.query;
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (companyId) {
    query.company = companyId;
  }
  try {
    const products = await Product.find(query)
      .skip(parseInt(skip))
      .limit(limit === "-1" ? undefined : parseInt(limit))
      //sorting as creating newly
      .sort({ createdAt: -1 })
      .populate({ path: "company", select: "-__v" });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting the total number of products
router.get("/total", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.status(200).json(count);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get a specific product
router.get("/:id", getProduct, (req, res) => {
  res.json(res.product);
});

// Create a new product
router.post("/", async (req, res) => {
  const { name, category, quantity, company, unit } = req.body;
  const product = new Product({
    name,
    category,
    quantity,
    unit,
    company,
  });

  try {
    const newProduct = await product.save();
    await Company.findByIdAndUpdate(
      company,
      { $push: { products: newProduct._id } },
      { new: true }
    );
    console.log("newProduct", newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product
router.patch("/:id", getProduct, async (req, res) => {
  const { name, category, quantity, company, unit } = req.body;
  if (name != null) {
    res.product.name = name;
  }

  if (category != null) {
    res.product.category = category;
  }

  if (quantity != null) {
    res.product.quantity = quantity;
  }

  if (unit != null) {
    res.product.unit = unit;
  }

  if (company != null) {
    await Company.findByIdAndUpdate(
      res.product.company,
      { $pull: { products: res.product._id } },
      { new: true }
    );

    res.product.company = company;
    await Company.findByIdAndUpdate(
      company,
      { $push: { products: res.product._id } },
      { new: true }
    );
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    console.log(updatedProduct);
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete("/:id", getProduct, async (req, res) => {
  try {
    await Company.findByIdAndUpdate(
      res.product.company,
      { $pull: { products: res.product.id } },
      { new: true }
    );
    await Product.findByIdAndDelete(req.params.id);
    console.log("deleted: ", res.product);
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get a specific product by ID
async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate("company");
    if (product == null) {
      return res.status(404).json({ message: "Product not found!" });
    }
    res.product = product;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = router;
