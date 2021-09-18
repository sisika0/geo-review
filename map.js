let storage = localStorage;

let formLayout = `
  <div class="form" id="review-form">
    <h3 class="form__title">Отзыв:</h3>
    <input type="text" id="review-name" class="form__input" placeholder="Укажите ваше имя"/>
    <input type="text" id="review-place" class="form__input" placeholder="Укажите место"/>
    <textarea id="review-text" class="form__input form__input_textarea" placeholder="Оставьте отзыв"></textarea>
    <button class="form__btn" id="add-button">Добавить</button>
    <span class="form__error" id="error">Заполните все поля!</span>
  </div>
`;
let reviewsLayout = `
  <div class="slider">
    <button class="arrow prev" id="prev"></button>
    <div class="slider__container">
      <ul class="reviews" id="review-list"></ul>
    </div>
    <button class="arrow next" id="next"></button>
  </div>
`;

let init = () => {
  let currentCoords = [];

	let yMap = new ymaps.Map("map", {
		center: [59.935, 30.325],
		zoom: 15
	},
	{
		yandexMapDisablePoiInteractivity: true  
	});

  let myIconContentLayout = ymaps.templateLayoutFactory.createClass(
    `<div>
      <div style="font-size: 20px; margin: -9px auto;">{{ properties.geoObjects.length }}</div>
    </div>`
  );

	let yClusterer = new ymaps.Clusterer({
    clusterIcons: [
      {
          href: './assets/1-review.png',
          size: [70, 70],
          offset: [-35, -70]
      }],
    clusterIconContentLayout: myIconContentLayout,
		groupByCoordinates: true,
		clusterDisableClickZoom: true,
		clusterOpenBalloonOnClick: false,
	});

	let addReviewToStorage = (newReview) => {
		let storageContent = JSON.parse(storage.reviews || '[]');

		storageContent.push(newReview);

		storage.reviews = JSON.stringify(storageContent);
	};

	let getReviewsFromStorage = (coordsOfBalloon) => {
		let storageContent = JSON.parse(storage.reviews || '[]');
		let reviewArray = [];

		storageContent.forEach(obj => {
			if (coordsOfBalloon[0] === obj['coords'][0] && coordsOfBalloon[1] === obj['coords'][1]){
				reviewArray.push(obj['review'])
			}
		});

		return reviewArray;
	};

	let getCoordinatesFromStorage = () => {
		let storageContent = JSON.parse(storage.reviews || '[]');
		let coordsArray = [];

		storageContent.forEach(obj => {
			coordsArray.push(obj['coords']);
		});

		return coordsArray;
	};

	let fillBalloon = (coords) => {
		let reviews = getReviewsFromStorage(coords);
		let form = createForm(coords, reviews);
		
		yMap.balloon.open(coords, form.innerHTML, {
      maxHeight: 900
    });
	};

	let createPlacemark = (coords) => {
		let placemark = new ymaps.Placemark(coords, {}, 
    {
      iconLayout: 'default#image',
      iconImageHref: './assets/1-review.png',
      iconImageSize: [70, 70],
      iconImageOffset: [-35, -70]
    });

		yClusterer.add(placemark);
	};

	let createForm = (coords, reviews) => {
    currentCoords = coords;

		let formWrapper = document.createElement('div');

    if (reviews.length === 0) {
      formWrapper.innerHTML = formLayout;

      return formWrapper
    }

    formWrapper.innerHTML = reviewsLayout + formLayout;

    let reviewList = formWrapper.querySelector('#review-list');
    let nextArrow = formWrapper.querySelector('#next');

		reviews.forEach(elem => {
			let reviewsItem = document.createElement('li');

			reviewsItem.classList.add('reviews__item');
			reviewsItem.innerHTML = `
        <div class="review__header">
          <span class="review__name">${elem.name}</span>
          <span class="review__place"> про ${elem.place}</span>
        </div>
				<blockquote class="review__text">
          <q>${elem.text}</q>
        </blockquote>
			`;

			reviewList.appendChild(reviewsItem);
		});

    if (reviewList.children.length > 1) {
      nextArrow.classList.add('active')
    }

		return formWrapper;
	};

	yMap.cursors.push('crosshair');

	let coordsArray = getCoordinatesFromStorage();

	coordsArray.forEach(coords => {
		createPlacemark(coords)
	})

	yClusterer.events.add('click', e => {
		let clustererCoords = e.get('target').geometry.getCoordinates();

		fillBalloon(clustererCoords);
	});

	yMap.events.add('click', e => {
		let mapCoords = e.get('coords');

		fillBalloon(mapCoords);
	});

	yMap.geoObjects.add(yClusterer);

  let status = true;

	document.addEventListener('click', e => {
		if (e.target.id === 'add-button') {
			let coords = currentCoords;
      let name = document.querySelector('#review-name').value;
      let place = document.querySelector('#review-place').value;
      let text = document.querySelector('#review-text').value;
      let error = document.querySelector('#error');

			let newReview = {
				coords,
				review: { name, place, text },
			};

      if (!name || !place || !text) {
        error.style.display = 'inline'
      } else {
        addReviewToStorage(newReview);
        createPlacemark(coords);
        yMap.balloon.close(); 
      }
		}

    let reviewList = document.querySelector('#review-list');
    let nextArrow = document.querySelector('#next');
    let prevArrow = document.querySelector('#prev');

    if (e.target.id === 'next') {
      let curPos = getComputedStyle(reviewList).transform.split(',')[4];
      
      reviewList.addEventListener('transitionend', () => {
        status = true;
      }, {once: true})

      if (Math.abs(curPos) / 250 === reviewList.children.length - 2) {
        nextArrow.style.visibility = 'hidden'
      }
      if (status) {
        reviewList.style.transform = `translateX(${+curPos - 250}px)`;
        prevArrow.style.visibility = 'visible';
        status = false;
      }
    }

    if (e.target.id === 'prev') {
      let curPos = getComputedStyle(reviewList).transform.split(',')[4];

      reviewList.addEventListener('transitionend', () => {
        status = true;
      }, {once: true})

      if (Math.abs(curPos) / 250 === 1) {
        prevArrow.style.visibility = 'hidden'
      }
      if (status) {
        reviewList.style.transform = `translateX(${+curPos + 250}px)`;
        nextArrow.style.visibility = 'visible';
        status = false;
      }
    }
	})
};

ymaps.ready(init);