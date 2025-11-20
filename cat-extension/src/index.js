// 고양이 이미지: CATAAS
function loadCatImage() {
  const img = document.getElementById("cat-img");
  const url = "https://cataas.com/cat?type=square&timestamp=" + Date.now();
  img.src = url;
  img.onerror = () => {
    img.alt = "failed to load cat image";
  };
}

// 고양이 사실: catfact.ninja
async function loadCatFact() {
  const factEl = document.getElementById("cat-fact");
  try {
    const res = await fetch("https://catfact.ninja/fact?max_length=140");
    if (!res.ok) throw new Error("cat fact error");
    const data = await res.json();
    factEl.textContent = data.fact;
  } catch (e) {
    factEl.textContent = "could not load cat fact, but cats are still great.";
  }
}

const FIXER_API_KEY = "46811cbe6f380ef4b7584e75e3bdfb30";
const CHURU_KRW_PRICE = 1000;
const COUNTRY_TO_CURRENCY = {
  us: "USD",
  jp: "JPY",
  eu: "EUR",
  uk: "GBP",
  cn: "CNY",
  ca: "CAD",
  au: "AUD",
  in: "INR"
};

// 제목 업데이트
function updateChuruTitle(countryCode) {
  const title = document.getElementById("churu-title");
  title.textContent = `i want ${countryCode} churu`;
}

// CHURU 가격 변환
async function loadChuruCost(countryCode) {
  const costEl = document.getElementById("churu-cost");
  const noteEl = document.getElementById("churu-note");

  // Fixer 키 체크
  if (FIXER_API_KEY === "YOUR_FIXER_API_KEY_HERE") {
    costEl.textContent = "set your Fixer API key first.";
    return;
  }

  const currency = COUNTRY_TO_CURRENCY[countryCode.toLowerCase()];
  if (!currency) {
    costEl.textContent = "unknown country. try: us, jp, eu, uk...";
    noteEl.textContent = "";
    return;
  }

  try {
    // Fixer free 플랜은 base가 EUR
    // KRW과 target 통화(currency)를 모두 받아서 KRW→currency 변환
    const url =
      "https://data.fixer.io/api/latest" +
      `?access_key=${encodeURIComponent(FIXER_API_KEY)}` +
      `&symbols=KRW,${currency}&format=1`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error("fixer failed");

    const rates = data.rates;

    // KRW → target currency 변환 비율
    const krwToTarget = rates[currency] / rates.KRW;

    // 환산된 츄르 가격
    const convertedPrice = (CHURU_KRW_PRICE * krwToTarget).toFixed(2);

    costEl.textContent = `churu price: ${convertedPrice} ${currency}`;
    noteEl.textContent = `(base: ${CHURU_KRW_PRICE.toLocaleString()} KRW)`;
  } catch (e) {
    costEl.textContent = "failed to load churu cost.";
    noteEl.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  // 기존 이미지/팩트 로딩
  loadCatImage();
  loadCatFact();

  // 국가 입력 이벤트
  const btn = document.getElementById("country-btn");
  const input = document.getElementById("country-input");

  // 처음 실행 시 자동으로 'us' 적용
  const defaultCountry = "us";
  input.value = defaultCountry;
  updateChuruTitle(defaultCountry);
  loadChuruCost(defaultCountry);

  // 입력 버튼 클릭 시 국가반영
  btn.addEventListener("click", () => {
    const countryInput = input.value.trim().toLowerCase();
    if (!countryInput) return;

    updateChuruTitle(countryInput);
    loadChuruCost(countryInput);
  });
});