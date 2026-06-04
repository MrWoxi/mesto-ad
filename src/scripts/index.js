import { createCardElement, updateLike, removeCard } from "./components/card.js";
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

const placesList = document.querySelector(".places__list");
const logo = document.querySelector(".header__logo");

const statsPopup = document.querySelector(".popup_type_info");
const statsInfoList = statsPopup.querySelector(".popup__info");
const statsUsersList = statsPopup.querySelector(".popup__list");

const editProfilePopup = document.querySelector(".popup_type_edit");
const profileForm = editProfilePopup.querySelector(".popup__form");
const profileNameInput = profileForm.querySelector(".popup__input_type_name");
const profileJobInput = profileForm.querySelector(".popup__input_type_description");
const profileSubmitButton = profileForm.querySelector(".popup__button");

const newCardPopup = document.querySelector(".popup_type_new-card");
const cardForm = newCardPopup.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const cardSubmitButton = cardForm.querySelector(".popup__button");

const imagePopup = document.querySelector(".popup_type_image");
const imagePopupImg = imagePopup.querySelector(".popup__image");
const imagePopupCaption = imagePopup.querySelector(".popup__caption");

const editProfileButton = document.querySelector(".profile__edit-button");
const addCardButton = document.querySelector(".profile__add-button");
const profileAvatar = document.querySelector(".profile__image");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");

const avatarPopup = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarPopup.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

let currentUserId;

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createStatItem = (term, value) => {
  const item = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);
  item.querySelector(".popup__info-term").textContent = term;
  item.querySelector(".popup__info-description").textContent = value;
  return item;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      statsInfoList.replaceChildren();
      statsUsersList.replaceChildren();

      statsInfoList.append(createStatItem("Всего карточек:", cards.length));
      statsInfoList.append(
        createStatItem("Первая создана:", formatDate(new Date(cards[cards.length - 1].createdAt)))
      );
      statsInfoList.append(
        createStatItem("Последняя создана:", formatDate(new Date(cards[0].createdAt)))
      );

      const usersMap = {};
      cards.forEach((card) => {
        const id = card.owner._id;
        if (!usersMap[id]) {
          usersMap[id] = { user: card.owner, count: 0 };
        }
        usersMap[id].count++;
      });

      const users = Object.values(usersMap);
      const maxCards = Math.max(...users.map((u) => u.count));

      statsInfoList.append(createStatItem("Всего пользователей:", users.length));
      statsInfoList.append(createStatItem("Максимум карточек от одного:", maxCards));

      users.forEach(({ user }) => {
        const badge = document
          .getElementById("popup-info-user-preview-template")
          .content.querySelector(".popup__list-item")
          .cloneNode(true);
        badge.textContent = user.name;
        statsUsersList.append(badge);
      });

      openModalWindow(statsPopup);
    })
    .catch(console.log);
};

const handlePreviewPicture = ({ name, link }) => {
  imagePopupImg.src = link;
  imagePopupImg.alt = name;
  imagePopupCaption.textContent = name;
  openModalWindow(imagePopup);
};

const handleLikeCard = (cardId, isLiked, likeButton, likeCount) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      updateLike(updatedCard.likes, likeButton, likeCount);
    })
    .catch(console.log);
};

const handleDeleteCard = (cardId, cardElement) => {
  deleteCard(cardId)
    .then(() => removeCard(cardElement))
    .catch(console.log);
};

const renderCard = (cardData, method = "append") => {
  placesList[method](
    createCardElement(cardData, currentUserId, {
      onPreviewPicture: handlePreviewPicture,
      onLikeCard: handleLikeCard,
      onDeleteCard: handleDeleteCard,
    })
  );
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const originalText = profileSubmitButton.textContent;
  profileSubmitButton.textContent = "Сохранение...";
  setUserInfo({ name: profileNameInput.value, about: profileJobInput.value })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(editProfilePopup);
    })
    .catch(console.log)
    .finally(() => {
      profileSubmitButton.textContent = originalText;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const originalText = avatarSubmitButton.textContent;
  avatarSubmitButton.textContent = "Сохранение...";
  updateAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      avatarForm.reset();
      closeModalWindow(avatarPopup);
    })
    .catch(console.log)
    .finally(() => {
      avatarSubmitButton.textContent = originalText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const originalText = cardSubmitButton.textContent;
  cardSubmitButton.textContent = "Создание...";
  addCard({ name: cardNameInput.value, link: cardLinkInput.value })
    .then((cardData) => {
      renderCard(cardData, "prepend");
      cardForm.reset();
      closeModalWindow(newCardPopup);
    })
    .catch(console.log)
    .finally(() => {
      cardSubmitButton.textContent = originalText;
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

logo.addEventListener("click", handleLogoClick);

editProfileButton.addEventListener("click", () => {
  clearValidation(profileForm, validationSettings);
  profileNameInput.value = profileTitle.textContent;
  profileJobInput.value = profileDescription.textContent;
  profileNameInput.dispatchEvent(new Event("input"));
  openModalWindow(editProfilePopup);
});

profileAvatar.addEventListener("click", () => {
  clearValidation(avatarForm, validationSettings);
  avatarForm.reset();
  openModalWindow(avatarPopup);
});

addCardButton.addEventListener("click", () => {
  clearValidation(cardForm, validationSettings);
  cardForm.reset();
  openModalWindow(newCardPopup);
});

document.querySelectorAll(".popup").forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

enableValidation(validationSettings);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    cards.forEach((card) => renderCard(card));
  })
  .catch(console.log);
