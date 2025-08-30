const { body, validationResult } = require('express-validator');

const createCustomerValidators = [
  body('first_name').notEmpty().withMessage('First name required'),
  body('last_name').notEmpty().withMessage('Last name required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('pincode').optional().matches(/^[0-9]{4,6}$/).withMessage('Invalid pincode'),
];

const updateCustomerValidators = [
  body('first_name').optional().notEmpty(),
  body('last_name').optional().notEmpty(),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
];

const createAddressValidators = [
  body('line1').notEmpty().withMessage('Address line1 required'),
  body('city').notEmpty().withMessage('City required'),
  body('pincode').optional().matches(/^[0-9]{4,6}$/).withMessage('Invalid pincode'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

module.exports = {
  createCustomerValidators,
  updateCustomerValidators,
  createAddressValidators,
  handleValidation
};
