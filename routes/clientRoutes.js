const express = require('express');
const router = express.Router();
const {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkAccess('clients'), getClients)
  .post(verifyToken, checkAccess('clients'), createClient);

router.route('/:id')
  .put(verifyToken, checkAccess('clients'), updateClient)
  .delete(verifyToken, checkAccess('clients'), deleteClient);

module.exports = router;
