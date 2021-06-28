let storage = localStorage;

let formLayout = `
	<ul class="reviews" id="review-list"></ul>
	<div class="form" id="review-form">
		<h3 class="form__title">Отзыв:</h3>
		<input type="text" id="review-name" class="form__input" placeholder="Укажите ваше имя"/>
		<input type="text" id="review-place" class="form__input" placeholder="Укажите место"/>
		<textarea id="review-text" class="form__input form__input_textarea" placeholder="Оставьте отзыв"></textarea>
		<button class="form__btn" id="add-button">Добавить</button>
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

	let yClusterer = new ymaps.Clusterer({
		groupByCoordinates: true,
		clusterDisableClickZoom: true,
		clusterOpenBalloonOnClick: false,
	});

	let addReviewToStorage = (newReview) => {
		let storageContent = JSON.parse(storage.reviews || '[]');

		storageContent.push(newReview);

		storage.reviews = JSON.stringify(storageContent);
		console.log(storage);
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
		
		yMap.balloon.open(coords, form.innerHTML)
	};

	let createPlacemark = (coords) => {
		let placemark = new ymaps.Placemark(coords);

		placemark.events.add('click', e => {
			let placemarkCoords = e.get('target').geometry.getCoordinates();

			fillBalloon(placemarkCoords);
		});

		yClusterer.add(placemark);
	};

	let createForm = (coords, reviews) => {
		let formWrapper = document.createElement('div');

		formWrapper.innerHTML = formLayout;

		let reviewList = formWrapper.querySelector('#review-list');

		currentCoords = coords;

		reviews.forEach(elem => {
			let reviewsItem = document.createElement('li');

			reviewsItem.classList.add('reviews__item');
			reviewsItem.innerHTML = `
				<div>
					<b>${elem.name}</b> [${elem.place}]
				</div>
				<div>${elem.text}</div>
			`;

			reviewList.appendChild(reviewsItem);
		});

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

	document.addEventListener('click', e => {
		if (e.target.id === 'add-button') {
			let coords = currentCoords;

			let newReview = {
				coords,
				review: {
					name: document.querySelector('#review-name').value,
					place: document.querySelector('#review-place').value,
					text: document.querySelector('#review-text').value,
				},
			};

			addReviewToStorage(newReview);
			createPlacemark(coords);
			yMap.balloon.close();
		}
	})
};

ymaps.ready(init);