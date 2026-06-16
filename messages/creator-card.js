const CreatorCardMessages = {
  CREATED: 'Creator Card Created Successfully.',
  RETRIEVED: 'Creator Card Retrieved Successfully.',
  DELETED: 'Creator Card Deleted Successfully.',

  SLUG_ALREADY_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED_FOR_PRIVATE: 'access_code is required when access_type is private',
  ACCESS_CODE_ONLY_ON_PRIVATE: 'access_code can only be set on private cards',
  NOT_FOUND: 'Creator card not found',
  DRAFT_NOT_RETRIEVABLE: 'Creator card not found',
  PRIVATE_CARD_ACCESS_CODE_REQUIRED: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',

  INVALID_SLUG_CHARACTERS: 'slug can only contain letters, numbers, hyphens and underscores',
  INVALID_URL_PROTOCOL: 'url must start with http:// or https://',
  INVALID_AMOUNT: 'amount must be a positive integer',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters',
  INVALID_CREATOR_REFERENCE_LENGTH: 'creator_reference must be exactly 20 characters',
};

module.exports = CreatorCardMessages;
