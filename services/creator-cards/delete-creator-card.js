const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const transformCreatorCard = require('@app/services/utils/creator-card-transformer');

const deleteCardSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

async function deleteCreatorCard(serviceData) {
  let response;

  try {
    const data = validator.validate(serviceData, parsedDeleteCardSpec);
    const { slug } = serviceData;

    const now = Date.now();
    const deletedCard = await CreatorCardRepository.raw().findOneAndUpdate(
      { slug, creator_reference: data.creator_reference, deleted: null },
      { $set: { deleted: now, updated: now } },
      { new: true, lean: true }
    );

    if (!deletedCard) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, { responseCode: 'NF01' });
    }

    response = transformCreatorCard(deletedCard, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = deleteCreatorCard;
