const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  userId,
  { onPreviewPicture, onLikeCard, onDeleteCard }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCount = cardElement.querySelector(".card__like-count");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardElement.querySelector(".card__title").textContent = cardData.name;

  likeCount.textContent = cardData.likes.length;

  if (cardData.likes.some((user) => user._id === userId)) {
    likeButton.classList.add("card__like-button_is-active");
  }

  if (cardData.owner._id !== userId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(cardData._id, cardElement);
    });
  }

  likeButton.addEventListener("click", () => {
    const isLiked = likeButton.classList.contains("card__like-button_is-active");
    onLikeCard(cardData._id, isLiked, likeButton, likeCount);
  });

  cardImage.addEventListener("click", () => {
    onPreviewPicture({ name: cardData.name, link: cardData.link });
  });

  return cardElement;
};

export const updateLike = (likes, likeButton, likeCount) => {
  likeButton.classList.toggle("card__like-button_is-active");
  likeCount.textContent = likes.length;
};

export const removeCard = (cardElement) => {
  cardElement.remove();
};
