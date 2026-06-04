import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  updateAvatar,
  addCard,
  deleteCard,
  changeLikeCardStatus,
} from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

// Настройки валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

let currentUserId;

// Вспомогательная функция: меняет текст кнопки на время запроса
const renderLoading = (button, isLoading, originalText) => {
  button.textContent = isLoading ? "Сохранение..." : originalText;
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeCard = (cardId, isLiked, likeButton, likeCount) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCount.textContent = updatedCard.likes.length;
    })
    .catch(console.log);
};

const handleDeleteCard = (cardId, cardElement) => {
  deleteCard(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch(console.log);
};

const renderCard = (cardData, method = "append") => {
  placesWrap[method](
    createCardElement(cardData, currentUserId, {
      onPreviewPicture: handlePreviewPicture,
      onLikeCard: handleLikeCard,
      onDeleteCard: handleDeleteCard,
    })
  );
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  renderLoading(submitButton, true);
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch(console.log)
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  renderLoading(submitButton, true);
  updateAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      avatarForm.reset();
      closeModalWindow(avatarFormModalWindow);
    })
    .catch(console.log)
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание...";
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      renderCard(cardData, "prepend");
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch(console.log)
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

// EventListeners для форм
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

// Открытие попапов
openProfileFormButton.addEventListener("click", () => {
  clearValidation(profileForm, validationSettings);
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  profileTitleInput.dispatchEvent(new Event("input"));
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  clearValidation(avatarForm, validationSettings);
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  clearValidation(cardForm, validationSettings);
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

// Слушатели закрытия для всех попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Включение валидации
enableValidation(validationSettings);

// Загрузка данных с сервера
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    cards.forEach((card) => renderCard(card));
  })
  .catch(console.log);
