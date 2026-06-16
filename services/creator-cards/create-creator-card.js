const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const transformCreatorCard = require('@app/services/utils/creator-card-transformer');
const {
  isValidSlug,
  generateUniqueSlug,
  isValidUrl,
  isPositiveInteger,
  isValidAccessCode,
} = require('@app/services/utils/creator-card-helpers');

const createCardSpec = `root {
  title string<lengthBetween:3,100>
  description? string<maxLength:500>
  slug? string<lengthBetween:5,50>
  creator_reference string<length:20>
  links[]? {
    title string<lengthBetween:1,100>
    url string<maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<lengthBetween:3,100>
      description? string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

async function slugExists(slug) {
  const existing = await CreatorCardRepository.findOne({
    query: { slug, deleted: null },
    projections: { _id: 1 },
  });
  return !!existing;
}

function validateLinks(links) {
  if (!Array.isArray(links)) {
    return;
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (!isValidUrl(link.url)) {
      throwAppError(CreatorCardMessages.INVALID_URL_PROTOCOL, ERROR_CODE.VALIDATIONERR);
    }
  }
}

function validateServiceRates(serviceRates) {
  if (!serviceRates) {
    return;
  }

  const rates = serviceRates.rates || [];
  for (let i = 0; i < rates.length; i++) {
    const rate = rates[i];
    if (!isPositiveInteger(rate.amount)) {
      throwAppError(CreatorCardMessages.INVALID_AMOUNT, ERROR_CODE.VALIDATIONERR);
    }
  }
}

function validateAccessControl(data) {
  const accessType = data.access_type || 'public';

  if (accessType === 'private') {
    if (typeof data.access_code === 'undefined') {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE, ERROR_CODE.INVLDDATA, {
        responseCode: 'AC01',
      });
    }

    if (!isValidAccessCode(data.access_code)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
    }
  }

  if (accessType === 'public' && typeof data.access_code !== 'undefined') {
    throwAppError(CreatorCardMessages.ACCESS_CODE_ONLY_ON_PRIVATE, ERROR_CODE.INVLDDATA, {
      responseCode: 'AC05',
    });
  }
}

async function createCreatorCard(serviceData) {
  let response;

  try {
    const data = validator.validate(serviceData, parsedCreateCardSpec);

    let slug;
    const slugWasProvided = typeof data.slug !== 'undefined' && data.slug !== null;

    if (slugWasProvided) {
      if (!isValidSlug(data.slug)) {
        throwAppError(CreatorCardMessages.INVALID_SLUG_CHARACTERS, ERROR_CODE.VALIDATIONERR);
      }

      if (await slugExists(data.slug)) {
        throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.INVLDDATA, {
          responseCode: 'SL02',
        });
      }

      slug = data.slug;
    } else {
      slug = await generateUniqueSlug(data.title, slugExists);
    }

    validateLinks(data.links);
    validateServiceRates(data.service_rates);
    validateAccessControl(data);

    const cardData = {
      title: data.title,
      description: data.description || null,
      slug,
      creator_reference: data.creator_reference,
      links: data.links || [],
      service_rates: data.service_rates || null,
      status: data.status,
      access_type: data.access_type || 'public',
      access_code: data.access_code || null,
    };

    const createdCard = await CreatorCardRepository.create(cardData);

    response = transformCreatorCard(createdCard, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = createCreatorCard;
