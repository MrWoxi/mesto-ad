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
const logo = document.querySelector(".header__logo");

const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUserList = usersStatsModalWindow.querySelector(".popup__list");
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

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const infoItem = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);
  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;
  return infoItem;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUserList.innerHTML = "";

      usersStatsModalInfoList.append(
        createInfoString("Всего карточек:", cards.length)
      );
      usersStatsModalInfoList.append(
        createInfoString(
          "Первая создана:",
          formatDate(new Date(cards[cards.length - 1].createdAt))
        )
      );
      usersStatsModalInfoList.append(
        createInfoString(
          "Последняя создана:",
          formatDate(new Date(cards[0].createdAt))
        )
      );

      // Подсчёт уникальных пользователей и количества их карточек
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

      usersStatsModalInfoList.append(
        createInfoString("Всего пользователей:", users.length)
      );
      usersStatsModalInfoList.append(
        createInfoString("Максимум карточек от одного:", maxCards)
      );

      // Список пользователей
      users.forEach(({ user }) => {
        const userElement = document
          .getElementById("popup-info-user-preview-template")
          .content.querySelector(".popup__list-item")
          .cloneNode(true);
        userElement.textContent = user.name;
        usersStatsModalUserList.append(userElement);
      });

      openModalWindow(usersStatsModalWindow);
    })
    .catch(console.log);
};

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
logo.addEventListener("click", handleLogoClick);

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
