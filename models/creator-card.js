const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * @typedef {Object} CreatorCardModel
 * @property {String} _id
 * @property {String} title
 * @property {String} description
 * @property {String} slug
 * @property {String} creator_reference
 * @property {Object[]} links
 * @property {Object} service_rates
 * @property {String} status
 * @property {String} access_type
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number|null} deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String },
  creator_reference: { type: SchemaTypes.String },
  links: { type: SchemaTypes.Mixed },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: null },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

modelSchema.index({ slug: 1 }, { unique: true });
modelSchema.index({ creator_reference: 1 });
modelSchema.index({ status: 1 });
modelSchema.index({ deleted: 1 });

/** @type {CreatorCardModel} */
module.exports = DatabaseModel.model(modelName, modelSchema);
