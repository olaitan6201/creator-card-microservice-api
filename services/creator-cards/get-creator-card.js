const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const transformCreatorCard = require('@app/services/utils/creator-card-transformer');

async function getCreatorCard(serviceData) {
  let response;

  try {
    const { slug, access_code: accessCode } = serviceData;

    const card = await CreatorCardRepository.findOne({
      query: { slug, deleted: null },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, { responseCode: 'NF01' });
    }

    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.DRAFT_NOT_RETRIEVABLE, ERROR_CODE.NOTFOUND, {
        responseCode: 'NF02',
      });
    }

    if (card.access_type === 'private') {
      if (typeof accessCode === 'undefined') {
        throwAppError(CreatorCardMessages.PRIVATE_CARD_ACCESS_CODE_REQUIRED, ERROR_CODE.INVLDREQ, {
          responseCode: 'AC03',
        });
      }

      if (accessCode !== card.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVLDREQ, {
          responseCode: 'AC04',
        });
      }
    }

    response = transformCreatorCard(card, { includeAccessCode: false });
  } catch (error) {
    appLogger.errorX(error, 'get-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = getCreatorCard;
