const STORAGE_KEY = 'travel_diary_trips';
const DRAFT_KEY = 'travel_diary_draft';

// Стартовые демо-поездки с фотографиями и геометками
const defaultTrips = [
    {
        id: 1,
        country: 'Италия',
        city: 'Рим',
        startDate: '12-05-2026',
        endDate: '19-05-2026',
        geotags: ['Колизей', 'Фонтан Треви', 'Район Трастевере'],
        photos: [
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80'
        ],
        impressions: 'Невероятная атмосфера античного города! Прогулки от Колизея до фонтана Треви на рассвете, лучший эспрессо в маленьких кофейнях Трастевере и потрясающие закаты со смотровой площадки Пинчо.'
    },
    {
        id: 2,
        country: 'Исландия',
        city: 'Рейкьявик',
        startDate: '03-08-2026',
        endDate: '11-08-2026',
        geotags: ['Водопад Скоугафосс', 'Голубая лагуна', 'Пляж Рейнисфьяра'],
        photos: [
            'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1200&q=80'
        ],
        impressions: 'Край водопадов, чёрных вулканических пляжей и ледников. Поездка по Золотому кольцу и купание в горячих источниках на закате оставили ощущения другой планеты.'
    },
    {
        id: 3,
        country: 'Россия',
        city: 'Санкт-Петербург',
        startDate: '14-06-2026',
        endDate: '18-06-2026',
        geotags: ['Дворцовая площадь', 'Новая Голландия', 'Севкабель Порт'],
        photos: [
            'https://images.unsplash.com/photo-1556610961-2fecc5927173?auto=format&fit=crop&w=1200&q=80'
        ],
        impressions: 'Белые ночи, развод мостов на Неве и прогулки по крышам исторического центра. Обязательно стоит заглянуть в Новую Голландию и прокатиться на теплоходе по каналам.'
    }
];

// Состояние приложения
let trips = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (!trips) {
    trips = defaultTrips;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

let draftPhotos = [];
let draftGeotags = [];
let editingTripId = null; // null = создание новой поездки, число = ID редактируемой

// Регулярные выражения по ТЗ
const nameRegex = /^[A-Za-zА-Яа-яЁё\s-]{2,50}$/;
const dateRegex = /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/;

// --- ФОНОВОЕ СЛАЙД-ШОУ ИЗ ФОТОГРАФИЙ ПУТЕШЕСТВИЙ ---
const fallbackBgPhotos = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80'
];

let bgIndex = 0;
let activeSlideSlot = 1;

function getAllTripPhotos() {
    const userPhotos = trips.flatMap(t => t.photos || []);
    return userPhotos.length > 0 ? userPhotos : fallbackBgPhotos;
}

function updateBackgroundSlide() {
    const photos = getAllTripPhotos();
    const photoUrl = photos[bgIndex % photos.length];
    bgIndex++;

    const slide1 = document.getElementById('bgSlide1');
    const slide2 = document.getElementById('bgSlide2');

    if (activeSlideSlot === 1) {
        slide2.style.backgroundImage = `url('${photoUrl}')`;
        slide2.classList.add('active');
        slide1.classList.remove('active');
        activeSlideSlot = 2;
    } else {
        slide1.style.backgroundImage = `url('${photoUrl}')`;
        slide1.classList.add('active');
        slide2.classList.remove('active');
        activeSlideSlot = 1;
    }
}

document.getElementById('bgSlide1').style.backgroundImage = `url('${getAllTripPhotos()[0]}')`;
bgIndex = 1;
setInterval(updateBackgroundSlide, 7000);

// --- УТИЛИТЫ ДЛЯ ДАТ ---
function parseDateDDMMYYYY(dateStr) {
    if (!dateRegex.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

function calculateDays(startStr, endStr) {
    const start = parseDateDDMMYYYY(startStr);
    const end = parseDateDDMMYYYY(endStr);
    if (!start || !end || start > end) return null;
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatDaysWord(days) {
    const mod10 = days % 10;
    const mod100 = days % 100;
    if (mod10 === 1 && mod100 !== 11) return `${days} день`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${days} дня`;
    return `${days} дней`;
}

// --- НАВИГАЦИЯ ---
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.page-section');

function switchSection(sectionId) {
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    if (sectionId === 'tripsSection') renderTrips(searchInput.value);
    if (sectionId === 'statsSection') renderStats();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'navAddBtn' && editingTripId !== null) {
            exitEditMode();
            loadDraft();
        }
        switchSection(btn.dataset.section);
    });
});

document.getElementById('backToTripsBtn').addEventListener('click', () => {
    switchSection('tripsSection');
});

// --- РЕНДЕР СПИСКА ПОЕЗДОК ---
const tripsGrid = document.getElementById('tripsGrid');
const searchInput = document.getElementById('searchInput');

function renderTrips(filterQuery = '') {
    tripsGrid.innerHTML = '';
    const query = filterQuery.trim().toLowerCase();

    const filtered = trips.filter(t => {
        const geotagsMatch = (t.geotags || []).some(g => g.toLowerCase().includes(query));
        return (
            t.country.toLowerCase().includes(query) ||
            t.city.toLowerCase().includes(query) ||
            geotagsMatch
        );
    });

    if (filtered.length === 0) {
        tripsGrid.innerHTML = `<div class="empty-state"><h3>Поездок пока не найдено</h3><p>Нажмите «+ Добавить поездку», чтобы сохранить первое воспоминание.</p></div>`;
        return;
    }

    filtered.forEach(trip => {
        const days = calculateDays(trip.startDate, trip.endDate) || 1;
        const coverPhoto = trip.photos && trip.photos.length > 0
            ? `<img src="${trip.photos[0]}" alt="${trip.city}" onerror="this.style.display='none'">`
            : '';

        const geotags = trip.geotags || [];
        const geotagsHTML = geotags.length > 0
            ? `<div class="card-geotags">${geotags.slice(0, 3).map(g => `<span class="geotag-pill">📍 ${g}</span>`).join('')}${geotags.length > 3 ? `<span class="geotag-pill">+${geotags.length - 3}</span>` : ''}</div>`
            : '';

        const card = document.createElement('article');
        card.className = 'trip-card';
        card.innerHTML = `
            <div class="card-cover">
                ${coverPhoto}
                <span class="duration-badge">${formatDaysWord(days)}</span>
                <div class="card-location-overlay">
                    <div class="card-location">${trip.country}</div>
                    <h3 class="card-title">${trip.city}</h3>
                </div>
            </div>
            <div class="card-body">
                <div class="card-dates">📅 ${trip.startDate} — ${trip.endDate}</div>
                ${geotagsHTML}
                <p class="card-preview">${trip.impressions}</p>
                <div class="card-footer">
                    <button class="btn-glass open-detail-btn">Подробнее</button>
                    <div class="card-actions-right">
                        <button class="btn-edit edit-trip-btn" title="Редактировать">✏️ Изменить</button>
                        <button class="btn-danger delete-trip-btn" title="Удалить">🗑️</button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector('.open-detail-btn').addEventListener('click', () => openTripDetail(trip.id));
        card.querySelector('.edit-trip-btn').addEventListener('click', () => startEditTrip(trip.id));
        card.querySelector('.delete-trip-btn').addEventListener('click', () => deleteTrip(trip.id));

        tripsGrid.append(card);
    });
}

searchInput.addEventListener('input', (e) => {
    renderTrips(e.target.value);
});

function deleteTrip(id) {
    trips = trips.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    renderTrips(searchInput.value);
}

// --- ДЕТАЛЬНЫЙ ПРОСМОТР ПОЕЗДКИ ---
function openTripDetail(id) {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    const days = calculateDays(trip.startDate, trip.endDate) || 1;
    const detailContent = document.getElementById('detailContent');
    const hasPhotos = trip.photos && trip.photos.length > 0;
    const geotags = trip.geotags || [];

    // Кнопка редактирования в шапке детального просмотра
    document.getElementById('detailEditBtn').onclick = () => startEditTrip(trip.id);

    const galleryHTML = hasPhotos ? `
        <div class="gallery-section">
            <div class="main-photo-frame">
                <img id="activeGalleryPhoto" src="${trip.photos[0]}" alt="${trip.city}">
            </div>
            ${trip.photos.length > 1 ? `
                <div class="thumbnails-row">
                    ${trip.photos.map((url, idx) => `
                        <img src="${url}" class="thumb-img ${idx === 0 ? 'active' : ''}" data-url="${url}">
                    `).join('')}
                </div>
            ` : ''}
        </div>
    ` : '';

    const geotagsHTML = geotags.length > 0 ? `
        <div class="detail-geotags">
            ${geotags.map(tag => {
                const q = encodeURIComponent(`${tag}, ${trip.city}, ${trip.country}`);
                return `<a class="geotag-link" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" title="Посмотреть геометку на карте">📍 ${tag} ↗</a>`;
            }).join('')}
        </div>
    ` : '';

    const defaultMapQuery = encodeURIComponent(
        geotags.length > 0 ? `${geotags[0]}, ${trip.city}, ${trip.country}` : `${trip.city}, ${trip.country}`
    );

    detailContent.innerHTML = `
        <div class="detail-header">
            <div>
                <div class="card-location">${trip.country}</div>
                <h1>${trip.city}</h1>
                <div class="detail-meta">
                    <span>📅 ${trip.startDate} — ${trip.endDate}</span>
                    <span>⏱️ Длительность: <strong>${formatDaysWord(days)}</strong></span>
                </div>
                ${geotagsHTML}
            </div>
        </div>

        ${galleryHTML}

        <div class="detail-grid">
            <div class="impressions-box">
                <h3>📝 Впечатления</h3>
                <div class="impressions-text">${trip.impressions}</div>
            </div>

            <div class="map-box">
                <h3>📍 Локация и геометки</h3>
                <iframe class="map-frame"
                    src="https://maps.google.com/maps?q=${defaultMapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    title="Карта локации">
                </iframe>
                <a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${defaultMapQuery}" target="_blank">
                    Открыть ${trip.city} (${trip.country}) в Google Картах ↗
                </a>
            </div>
        </div>
    `;

    const thumbs = detailContent.querySelectorAll('.thumb-img');
    const mainPhoto = document.getElementById('activeGalleryPhoto');
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainPhoto.src = thumb.dataset.url;
        });
    });

    switchSection('detailSection');
}

// --- РЕЖИМ РЕДАКТИРОВАНИЯ СУЩЕСТВУЮЩЕЙ ПОЕЗДКИ ---
const formTitle = document.getElementById('formTitle');
const draftStatus = document.getElementById('draftStatus');
const submitTripBtn = document.getElementById('submitTripBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const clearDraftBtn = document.getElementById('clearDraftBtn');

function startEditTrip(id) {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    editingTripId = trip.id;

    // Обновляем заголовки и кнопки формы под режим редактирования
    formTitle.textContent = `Редактирование: ${trip.city}`;
    draftStatus.textContent = 'Режим редактирования';
    draftStatus.classList.add('edit-mode');
    submitTripBtn.textContent = 'Сохранить изменения';
    cancelEditBtn.style.display = 'inline-block';
    clearDraftBtn.style.display = 'none';

    // Подставляем текущие данные поездки в поля
    countryInput.value = trip.country;
    cityInput.value = trip.city;
    startDateInput.value = trip.startDate;
    endDateInput.value = trip.endDate;
    impressionsInput.value = trip.impressions;
    draftPhotos = [...(trip.photos || [])];
    draftGeotags = [...(trip.geotags || [])];

    // Убираем старые классы ошибок и обновляем превью
    [countryInput, cityInput, startDateInput, endDateInput, impressionsInput].forEach(el => {
        el.classList.remove('valid', 'invalid');
    });
    photoError.classList.remove('visible');

    renderDraftPhotos();
    renderDraftGeotags();
    updateDurationPreview();

    switchSection('addSection');
}

function exitEditMode() {
    editingTripId = null;
    formTitle.textContent = 'Новая поездка';
    draftStatus.textContent = 'Черновик сохраняется';
    draftStatus.classList.remove('edit-mode');
    submitTripBtn.textContent = 'Сохранить поездку';
    cancelEditBtn.style.display = 'none';
    clearDraftBtn.style.display = 'inline-block';
}

cancelEditBtn.addEventListener('click', () => {
    const prevId = editingTripId;
    exitEditMode();
    resetFormVisuals();
    loadDraft();
    if (prevId) {
        openTripDetail(prevId);
    } else {
        switchSection('tripsSection');
    }
});

// --- ГЕОМЕТКИ В ФОРМЕ ---
const geotagInput = document.getElementById('geotagInput');
const addGeotagBtn = document.getElementById('addGeotagBtn');
const draftGeotagsList = document.getElementById('draftGeotagsList');

function addDraftGeotag() {
    const tag = geotagInput.value.trim();
    if (!tag) return;

    if (!draftGeotags.includes(tag)) {
        draftGeotags.push(tag);
        renderDraftGeotags();
        if (editingTripId === null) saveDraft();
    }
    geotagInput.value = '';
    geotagInput.focus();
}

function renderDraftGeotags() {
    draftGeotagsList.innerHTML = '';
    draftGeotags.forEach((tag, index) => {
        const chip = document.createElement('span');
        chip.className = 'draft-geotag-chip';
        chip.innerHTML = `📍 ${tag} <button type="button" title="Удалить метку">×</button>`;
        chip.querySelector('button').addEventListener('click', () => {
            draftGeotags.splice(index, 1);
            renderDraftGeotags();
            if (editingTripId === null) saveDraft();
        });
        draftGeotagsList.append(chip);
    });
}

addGeotagBtn.addEventListener('click', addDraftGeotag);
geotagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addDraftGeotag();
    }
});

// --- ЗАГРУЗКА ФОТО: DRAG-AND-DROP, ОБЗОР ФАЙЛОВ И ССЫЛКИ (GOOGLE ДИСК / URL) ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const photoUrlInput = document.getElementById('photoUrlInput');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const photoError = document.getElementById('photoError');
const draftPhotosList = document.getElementById('draftPhotosList');

function compressAndAddFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
            draftPhotos.push(compressedDataUrl);
            renderDraftPhotos();
            if (editingTripId === null) saveDraft();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleFiles(files) {
    Array.from(files).forEach(file => compressAndAddFile(file));
}

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

function normalizePhotoUrl(url) {
    const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`;
    }
    const gdriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (gdriveOpenMatch && gdriveOpenMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${gdriveOpenMatch[1]}`;
    }
    return url;
}

function addDraftPhotoByUrl() {
    const rawUrl = photoUrlInput.value.trim();
    const urlPattern = /^https?:\/\/.+\..+/i;

    if (!urlPattern.test(rawUrl)) {
        photoError.classList.add('visible');
        return;
    }

    photoError.classList.remove('visible');
    const finalUrl = normalizePhotoUrl(rawUrl);
    draftPhotos.push(finalUrl);
    photoUrlInput.value = '';
    renderDraftPhotos();
    if (editingTripId === null) saveDraft();
}

addPhotoBtn.addEventListener('click', addDraftPhotoByUrl);
photoUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addDraftPhotoByUrl();
    }
});

function renderDraftPhotos() {
    draftPhotosList.innerHTML = '';
    draftPhotos.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'draft-photo-item';
        item.innerHTML = `
            <img src="${src}" alt="Фото ${index + 1}">
            <button type="button" class="remove-photo-btn" title="Удалить">×</button>
        `;
        item.querySelector('.remove-photo-btn').addEventListener('click', () => {
            draftPhotos.splice(index, 1);
            renderDraftPhotos();
            if (editingTripId === null) saveDraft();
        });
        draftPhotosList.append(item);
    });
}

// --- ФОРМА, ВАЛИДАЦИЯ И SESSIONSTORAGE ---
const countryInput = document.getElementById('countryInput');
const cityInput = document.getElementById('cityInput');
const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const impressionsInput = document.getElementById('impressionsInput');
const durationPreview = document.getElementById('durationPreview');

function saveDraft() {
    if (editingTripId !== null) return; // Не перезаписываем черновик при редактировании старой поездки
    const draft = {
        country: countryInput.value,
        city: cityInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        impressions: impressionsInput.value,
        photos: draftPhotos,
        geotags: draftGeotags
    };
    try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
        console.warn('Превышен лимит sessionStorage для черновика фото');
    }
}

function loadDraft() {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
    if (!saved) {
        resetFormVisuals();
        return;
    }

    countryInput.value = saved.country || '';
    cityInput.value = saved.city || '';
    startDateInput.value = saved.startDate || '';
    endDateInput.value = saved.endDate || '';
    impressionsInput.value = saved.impressions || '';
    draftPhotos = saved.photos || [];
    draftGeotags = saved.geotags || [];

    renderDraftPhotos();
    renderDraftGeotags();
    updateDurationPreview();
}

function validateNameField(input) {
    const isValid = nameRegex.test(input.value.trim());
    input.classList.toggle('valid', isValid);
    input.classList.toggle('invalid', !isValid);
    return isValid;
}

function validateDates() {
    const startObj = parseDateDDMMYYYY(startDateInput.value.trim());
    const endObj = parseDateDDMMYYYY(endDateInput.value.trim());

    const isStartValid = startObj !== null;
    startDateInput.classList.toggle('valid', isStartValid);
    startDateInput.classList.toggle('invalid', !isStartValid);

    const isEndValid = endObj !== null && (!startObj || startObj <= endObj);
    endDateInput.classList.toggle('valid', isEndValid);
    endDateInput.classList.toggle('invalid', !isEndValid);

    updateDurationPreview();
    return isStartValid && isEndValid;
}

function updateDurationPreview() {
    const days = calculateDays(startDateInput.value.trim(), endDateInput.value.trim());
    if (days !== null) {
        durationPreview.innerHTML = `Длительность поездки: <strong>${formatDaysWord(days)}</strong>`;
    } else {
        durationPreview.innerHTML = `Длительность поездки: <strong>укажите корректные даты (начало ≤ конец)</strong>`;
    }
}

function validateImpressions() {
    const isValid = impressionsInput.value.trim().length >= 3;
    impressionsInput.classList.toggle('valid', isValid);
    impressionsInput.classList.toggle('invalid', !isValid);
    return isValid;
}

countryInput.addEventListener('input', () => { validateNameField(countryInput); saveDraft(); });
cityInput.addEventListener('input', () => { validateNameField(cityInput); saveDraft(); });
startDateInput.addEventListener('input', () => { validateDates(); saveDraft(); });
endDateInput.addEventListener('input', () => { validateDates(); saveDraft(); });
impressionsInput.addEventListener('input', () => { validateImpressions(); saveDraft(); });

function resetFormVisuals() {
    document.getElementById('tripForm').reset();
    draftPhotos = [];
    draftGeotags = [];
    renderDraftPhotos();
    renderDraftGeotags();
    [countryInput, cityInput, startDateInput, endDateInput, impressionsInput].forEach(el => {
        el.classList.remove('valid', 'invalid');
    });
    photoError.classList.remove('visible');
    updateDurationPreview();
}

function resetFormAndDraft() {
    resetFormVisuals();
    sessionStorage.removeItem(DRAFT_KEY);
}

clearDraftBtn.addEventListener('click', resetFormAndDraft);

document.getElementById('tripForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const isCountryOk = validateNameField(countryInput);
    const isCityOk = validateNameField(cityInput);
    const areDatesOk = validateDates();
    const isImpressionsOk = validateImpressions();

    if (!isCountryOk || !isCityOk || !areDatesOk || !isImpressionsOk) {
        return;
    }

    const tripData = {
        id: editingTripId !== null ? editingTripId : Date.now(),
        country: countryInput.value.trim(),
        city: cityInput.value.trim(),
        startDate: startDateInput.value.trim(),
        endDate: endDateInput.value.trim(),
        geotags: [...draftGeotags],
        photos: [...draftPhotos],
        impressions: impressionsInput.value.trim()
    };

    if (editingTripId !== null) {
        // Обновляем существующую поездку
        const idx = trips.findIndex(t => t.id === editingTripId);
        if (idx !== -1) {
            trips[idx] = tripData;
        }
    } else {
        // Добавляем новую поездку
        trips.unshift(tripData);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    } catch (err) {
        alert('Хранилище браузера заполнено! Попробуйте добавить меньше тяжёлых фото или удалите старые поездки.');
        return;
    }

    const savedId = tripData.id;
    const wasEditing = editingTripId !== null;

    if (wasEditing) {
        exitEditMode();
        resetFormVisuals();
        loadDraft();
        updateBackgroundSlide();
        openTripDetail(savedId); // Сразу возвращаем на обновлённую страницу поездки
    } else {
        resetFormAndDraft();
        updateBackgroundSlide();
        switchSection('tripsSection');
    }
});

// --- СТАТИСТИКА ---
function renderStats() {
    const uniqueCountries = [...new Set(trips.map(t => t.country.trim()))];
    const uniqueCities = [...new Set(trips.map(t => t.city.trim()))];

    let totalDays = 0;
    trips.forEach(t => {
        const d = calculateDays(t.startDate, t.endDate);
        if (d) totalDays += d;
    });

    document.getElementById('totalTripsStat').textContent = trips.length;
    document.getElementById('totalCountriesStat').textContent = uniqueCountries.length;
    document.getElementById('totalCitiesStat').textContent = uniqueCities.length;
    document.getElementById('totalDaysStat').textContent = totalDays;

    const countriesContainer = document.getElementById('uniqueCountriesList');
    const citiesContainer = document.getElementById('uniqueCitiesList');

    countriesContainer.innerHTML = uniqueCountries.length
        ? uniqueCountries.map(c => `<span class="place-tag">${c}</span>`).join('')
        : '<span class="subtitle">Пока нет данных</span>';

    citiesContainer.innerHTML = uniqueCities.length
        ? uniqueCities.map(c => `<span class="place-tag">${c}</span>`).join('')
        : '<span class="subtitle">Пока нет данных</span>';
}

// Инициализация
loadDraft();
renderTrips();