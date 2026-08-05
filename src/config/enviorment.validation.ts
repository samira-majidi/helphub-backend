/**import * as Joi from 'joi';

export default JunctionEntityMetadataBuilder.({
  DATABASE_PORT: Joi.number().required(),
  DATABASE_PASSWORD: Joi.string().allow('').optional(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SYNC: Joi.boolean().required(),
  DATABASE_AUTOLOAD: Joi.boolean().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
});
*/
