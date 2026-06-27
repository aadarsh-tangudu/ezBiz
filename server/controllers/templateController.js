const Template = require("../models/Template");

module.exports = {
  getTemplates: async (req, res) => {
    try {
      const templates = await Template.find({ userId: req.user.id });
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addTemplate: async (req, res) => {
    try {
      const template = new Template({ ...req.body, userId: req.user.id });
      await template.save();
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
