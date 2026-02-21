const { ZodError } = require('zod');

/**
 * Zod validation middleware factory.
 * Usage: router.post('/signup', validate(signupSchema), handler)
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result; // Replace with parsed (coerced/stripped) data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = (err.errors || err.issues).map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({ 
          msg: 'Validation failed',
          errors 
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
