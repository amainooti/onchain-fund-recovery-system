/**
 * Request validation middleware
 */

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'params' ? req.params : 
                 source === 'query' ? req.query : 
                 req.body;

    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    // Replace request data with validated data
    if (source === 'params') req.params = value;
    else if (source === 'query') req.query = value;
    else req.body = value;

    next();
  };
};

export default validate;