('use strict');

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = crypto.randomUUID(); // jak tworzymy objecty to warto kazdemu z nich pzypisac zmienna id ktora bedzie sie roznila dla kazdej instancji, w ten sposob bedzimey mogli znaLsc obiekty ktore najczesciej zamniete sa w array i zeby je znalesc to musza miec cos uniklanego. crypto.randomUID() to API ktore tworzy uniklane id dla kazdego mozna tez zaimportowac nanoID

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const [day, month] = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
    })
      .format(this.date)
      .split(' ');

    const date = `${month} ${day}`;
    this.description = `${
      this.type[0].toUpperCase() + this.type.slice(1)
    } on ${date}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); //dzieki temu ze jest w construcotrzre to sie wywola odrazu po utworzeniu obiektu i doda nam property this.pace
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #isClicked = false;
  #map;
  #mapEvent;
  #marker;
  #workouts = [];
  constructor() {
    this.#getPosition(); //wywolujemy tutej get poistion wtedy odrazu jak stworzymy obiekt to sie wywola ta metoda, a obiekt tworzymy na zewnatrz klas wiec wywola sie odrazu jak zaladuje sie strona

    form.addEventListener('submit', this.#newWorkout.bind(this));
    //submit event czyli jak form zostanie wyslany, czyli jak klikniemy btn submit lub ennter

    inputType.addEventListener('change', this.#toggleElevationField); //change event to dziala na inpucie <select> w formie jak zmienimy w nim opcje wyboru to wtedy sie zdarzy event
  } //construcotr jest wywowalny odrazu gdy stworozmy nowy object, wiec mozemy tu tez miec metody, nie tyko properties, wsyztzskie eventlistenery tez tu powinny byc zeby sie wywolaly odrazu jak swtorzy sie obiekt czyli w tym przyapdku jak zaladuje sie strtona

  #getPosition() {
    if (navigator.geolocation) {
      // geolocation to API ,to nam bedzie chcialo pobrac lokalizacje uzytkownika, i uzytkownikowi sie wysiwtrli box podobny do alertu, ze chcemy pohrac lokzalicaje, i moze dac pozwol lub odmow. Dlatego funckja getCurrentPosition() przyjmuje jako argumenty dwie callbvack funkcje, pierwsza ktora okresla co zrobic jak jesy sukces czyli sie uzytkownik zgodzi i uda sie pobrac a druga okresla co zrobic  jak sie nie zgodzi lub nie uda sie pobrac lokalizacji. Ta pierwsza od sukcesu przyjmuje paramtery position ktory jest wlasnie objectem z pozycja. Zamykamy wsyztskop w ifie ktory sprawdza czy API jest na danej przegladarce bo moze byc nie wspierane na jakjis starych przegladarkach
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    } //muismy uzyc .bind na #loadMap bo ten callback jesty traktowany jak normalny fucntion call  wiec w takim nornlanym function call this = undefined, wiec jak mamy pozniej this w loadMap to by nam czytalo undefined a tak to jak uzjemy this w bind to pointuje na obiekt na ktorym wywolaismy i this w loadmap bedfzie spoworotem pokazyuwalo na app
  }

  #loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude; //z naszegp objectu position wycigamy property coords i jeszcze z niego latitude i longitude czyli nasze wspolrzedne x i y. beda potrzebne do wycnetrowania mapy na nasze wspolrzedne
    const coords = [latitude, longitude];

    //kod ponizej jest skopiowany i zmodiufkowany ze strony paczki leaflet na podsyawie ich dokumentacji, musimy pozmieniac troche zmienne itp zeby pasowalo do naszego kodu. Dziala bo w html w headzie dolaczylismy skrypt i css do tej paczki (bedziemy to robic normnlanioe NPM a nie w headzie, wersja pokazowa tu jest ze tak mozna).

    this.#map = L.map('map').setView(coords, 13); //zmiana var na const. string'map' okresla id elementu w naszym htmlu w kotrym chcemy wystwelic mape, wiec musimy miec element z takim id jak string tu. W setView() wstawiamy array z naszymi wspolrzednymi x i y, 13 to stopniec zooma

    //w titleLayer okreslamy jaka mape podczytujemy, mozemy tez inne podczytac jak google maps itp, i je modyfuikowac wygladowo
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this.#showFormAndMarker.bind(this)); //map to obiekt srtoworzony przez lefleat bibioleteke i on ma oporcz metod z js ma tez metody ktore dzialaja tylko dla obiektow z tej bibiolteki, a wiec on() dziala podonbnie do AddEventListenera ale mozna go zastoswoac tylko na elementach stworzonych za pomoca bibiolteki leaflet. Wywola sie za kazdym razem jak klikniemy na mape, nie moglismy dodac normlanegfo addeventListenera na caly element z html gdzie wygneerowalismy mape bo wtyedy nie moglisby miec dostepu do coordow klikniecia. a tak to dodajemy eventlistyenmer na sama mape z bibiolteki leaflet a nie na element gdzie jest wygenerowana mapa i to nam pozwoli sciagnac koordy miejsca z mapy na kotre kliknelismy
  }

  #showFormAndMarker(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden'); //wyswoetlamy naszą form
    inputDistance.focus();
    if (!this.#isClicked) {
      this.#displayMarker();
      this.#isClicked = true;
    }
  }

  #hideForm() {
    form.style.display = 'none'; //to prevent new workouts sliding up
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000); //after one second display of a form will change back to grid

    // prettier-ignore
    inputDuration.value =
    inputDistance.value =
    inputCadence.value =
    inputElevation.value =
    '';
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  } // zmieniamy klase elementom na podstawie tego ze zajdzie zmiana opcjiw elemenecie select. To dziala tutaj dobrze bo sa tylko dwie opcje

  #newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(input => input > 0);
    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        //sprawdzenie robimyh w srodku dlatego ze moze byc wysiwtelone tylko cadence lub elevation wiec definujemy je tylko w przypadku jak jest poprawny type i tylko wtedy mozemy sprawdzic czyt jest numerem czy nie
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this.#renderWorkout(workout);

    this.#hideForm();

    this.#displayPopup(workout);

    this.#isClicked = false;
  }

  #displayMarker() {
    const { lat, lng } = this.#mapEvent.latlng; //wycigamy z naszego eventu wspolrzedne x i y miejsca w ktore klikenlismy na mapie
    this.#marker = L.marker([lat, lng], { riseOnHover: true });
    //dodajemy wspolrzedne klikeniacia w arr i  wyswietlamy na tych wspolrzednych  nasz znacznik,. mozmey dodac tez opcje znacnzika
    this.#marker.addTo(this.#map);
  }

  #displayPopup(workout) {
    this.#marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      ) // dodaejmy obiekt z opcjami popup widnow, wszytsko opisae jest w dokumentacji leaflet wiec tam szukaj wszytskiego
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      ) //okreslamy tekst naszego popupa
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
          <span class="workout__icon">⛰️</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
      </div>
    </li>
        `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
