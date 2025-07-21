import { useEffect, useState } from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], <Sunny />],
    [[1], <PartlySunny />],
    [[2], <PartlySunny />],
    [[3], <Cloudy />],
    [[45, 48], <Windy />],
    [[51, 56, 61, 66, 80], <Rainy />],
    [[53, 55, 63, 65, 57, 67, 81, 82], <Rainy />],
    [[71, 73, 75, 77, 85, 86], <Rainy />],
    [[95], <Stormy />],
    [[96, 99], <Stormy />],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return 'NOT FOUND';
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(dateStr));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchData() {
        try {
          setError('');
          setIsLoading(true);
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${query}`,
            { signal: controller.signal }
          );

          if (!geoRes.ok) throw new Error('Problem with fetching data !');

          const geoData = await geoRes.json();

          if (!geoData.results) throw new Error('Location not found');

          setResult(geoData.results.at(0));
        } catch (err) {
          if (err.name !== 'AbortError') {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setResult(null);
        setWeather({});
        return;
      }

      fetchData();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  useEffect(
    function () {
      async function fetchData() {
        try {
          setError('');
          setIsLoading(true);
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${result?.latitude}&longitude=${result?.longitude}&timezone=${result?.timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );

          if (!weatherRes.ok) throw new Error('Problem with fetching data !');

          const weatherData = await weatherRes.json();

          setWeather(weatherData.daily);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      if (!result) return;

      fetchData();
    },
    [result]
  );

  return (
    <div className="app">
      <Search query={query} setQuery={setQuery} />

      <List weather={weather} isLoading={isLoading} error={error} />
    </div>
  );
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search for a city "
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      id='search'
    />
  );
}

function List({ weather, isLoading, error }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <ul className="list scrollbar">
      {isLoading && <Loader />}

      {!isLoading &&
        !error &&
        dates?.map((date, i) => (
          <Card
            key={i}
            date={date}
            min={min.at(i)}
            max={max.at(i)}
            code={codes.at(i)}
            isToday={i === 0}
          />
        ))}

      {error && <ErrorMessage message={error} />}
    </ul>
  );
}

function Card({ date, min, max, code, isToday }) {
  const averageTemp = Math.round((min + max) / 2);

  return (
    <div className="card">
      <svg
        fill="none"
        viewBox="0 0 342 175"
        height="175"
        width="320"
        xmlns="http://www.w3.org/2000/svg"
        className="background">
        <path
          fill="url(#paint0_linear_103_640)"
          d="M0 66.4396C0 31.6455 0 14.2484 11.326 5.24044C22.6519 -3.76754 39.6026 0.147978 73.5041 7.97901L307.903 62.1238C324.259 65.9018 332.436 67.7909 337.218 73.8031C342 79.8154 342 88.2086 342 104.995V131C342 151.742 342 162.113 335.556 168.556C329.113 175 318.742 175 298 175H44C23.2582 175 12.8873 175 6.44365 168.556C0 162.113 0 151.742 0 131V66.4396Z"></path>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            y2="128"
            x2="354.142"
            y1="128"
            x1="0"
            id="paint0_linear_103_640">
            <stop stopColor="#5936B4"></stop>
            <stop stopColor="#362A84" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>
      <div className="cloud">{getWeatherIcon(code)}</div>
      <p className="main-text">{averageTemp}°</p>
      <div className="info">
        <div className="info-left">
          <p className="text-gray">
            H:{Math.ceil(max)}° L: {Math.floor(min)}°
          </p>
        </div>
        <p className="info-right"> {isToday ? 'Today' : formatDay(date)} </p>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="loader">
      <div className="bar1"></div>
      <div className="bar2"></div>
      <div className="bar3"></div>
      <div className="bar4"></div>
      <div className="bar5"></div>
      <div className="bar6"></div>
      <div className="bar7"></div>
      <div className="bar8"></div>
      <div className="bar9"></div>
      <div className="bar10"></div>
      <div className="bar11"></div>
      <div className="bar12"></div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="error">
      <svg
        className="wave"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
          fill-opacity="1"></path>
      </svg>

      <div className="icon-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          strokeWidth="0"
          fill="currentColor"
          stroke="currentColor"
          className="icon">
          <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"></path>
        </svg>
      </div>
      <div className="message-text-container">
        <p className="message-text">Error</p>
        <p className="sub-text">{message}</p>
      </div>
    </div>
  );
}

function PartlySunny() {
  return (
    <svg
      fill="#000000"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <title>ionicons-v5-n</title>
        <path
          fill="#ffffff"
          d="M340,480H106c-29.5,0-54.92-7.83-73.53-22.64C11.23,440.44,0,415.35,0,384.8c0-26.66,10.08-49.8,29.14-66.91,15.24-13.68,36.17-23.21,59-26.84h0c.06,0,.08,0,.09-.05,6.44-39,23.83-72.09,50.31-95.68A140.24,140.24,0,0,1,232,160c30.23,0,58.48,9.39,81.71,27.17a142.24,142.24,0,0,1,42.19,53.21,16,16,0,0,0,11.19,9c26,5.61,48.4,17.29,65.17,34C453,304.11,464,331.71,464,363.2c0,32.85-13.13,62.87-37,84.52C404.11,468.54,373.2,480,340,480Zm19-232.18Z"></path>
        <path
          fill="#ffce31"
          d="M387.89,221.68a168.8,168.8,0,0,1,34.76,14.71,4,4,0,0,0,5.82-2.44A97,97,0,0,0,432,207.27c-.39-52.43-43.48-95.22-95.91-95.27A95.46,95.46,0,0,0,281,129.33l-.06,0a3.38,3.38,0,0,0,1,6,162.45,162.45,0,0,1,51.28,26.4,173.92,173.92,0,0,1,45.32,52.51A16,16,0,0,0,387.89,221.68Z"></path>
        <path
          fill="#ffce31"
          d="M496,224H464a16,16,0,0,1,0-32h32a16,16,0,0,1,0,32Z"></path>
        <path
          fill="#ffce31"
          d="M336,96a16,16,0,0,1-16-16V48a16,16,0,0,1,32,0V80A16,16,0,0,1,336,96Z"></path>
        <path
          fill="#ffce31"
          d="M245.49,133.49a15.92,15.92,0,0,1-11.31-4.69l-22.63-22.62a16,16,0,0,1,22.63-22.63l22.62,22.63a16,16,0,0,1-11.31,27.31Z"></path>
        <path
          fill="#ffce31"
          d="M426.51,133.49a16,16,0,0,1-11.31-27.31l22.62-22.63a16,16,0,0,1,22.63,22.63L437.82,128.8A15.92,15.92,0,0,1,426.51,133.49Z"></path>
      </g>
    </svg>
  );
}

function Rainy() {
  return (
    <svg
      version="1.1"
      id="_x32_"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      fill="#75d6ff">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g>
          <path
            className="st0"
            style={{ fill: '#ffffff' }}
            d="M464.625,129.004c-20.281-20.109-47.094-31.391-75.563-31.766l-9.625-0.125l-2.141-9.359 c-5.703-24.813-19.891-47.25-39.953-63.234C316.703,8.161,291.859-0.324,265.469,0.004c-26.688,0.391-51.5,9.703-71.813,26.953 c-19.75,16.828-33.219,40.047-37.938,65.359l-2.188,11.703l-11.813-1.891c-6.781-1.063-12.922-1.547-18.813-1.469 c-29.063,0.406-56.281,12.109-76.656,32.984c-20.297,20.891-31.25,48.406-30.891,77.5c0.406,29.078,12.109,56.297,32.984,76.688 c20.906,20.281,48.422,31.266,77.5,30.875l263.25-3.531c29.063-0.406,56.281-12.109,76.656-32.984 c20.281-20.906,31.25-48.438,30.891-77.516C496.234,176.129,484.875,149.286,464.625,129.004z"></path>
          <path
            className="st0"
            d="M149.594,353.083c0,0-21.094,19.703-26.063,25.781c-1.891,2.313-3.313,5.078-4.094,8.156 c-2.813,11.203,3.969,22.594,15.188,25.422s22.594-3.984,25.422-15.188c0.781-3.094,0.828-6.172,0.266-9.109 C158.797,380.442,149.594,353.083,149.594,353.083z"></path>
          <path
            className="st0"
            d="M124.656,452.005c0,0-21.078,19.719-26.047,25.813c-1.891,2.313-3.328,5.047-4.094,8.125 c-2.828,11.219,3.969,22.594,15.172,25.422c11.219,2.828,22.594-3.969,25.422-15.188c0.797-3.078,0.828-6.188,0.266-9.094 C133.875,479.349,124.656,452.005,124.656,452.005z"></path>
          <path
            className="st0"
            d="M274.813,351.395c0,0-21.063,19.719-26.047,25.797c-1.891,2.313-3.313,5.063-4.078,8.141 c-2.844,11.219,3.969,22.594,15.156,25.422c11.234,2.813,22.609-3.969,25.438-15.188c0.781-3.094,0.828-6.172,0.25-9.109 C284.031,378.754,274.813,351.395,274.813,351.395z"></path>
          <path
            className="st0"
            d="M249.875,450.317c0,0-21.063,19.719-26.031,25.797c-1.906,2.328-3.313,5.063-4.094,8.141 c-2.828,11.219,3.969,22.594,15.188,25.422c11.203,2.828,22.594-3.969,25.406-15.172c0.781-3.094,0.828-6.188,0.266-9.109 C259.094,477.677,249.875,450.317,249.875,450.317z"></path>
          <path
            className="st0"
            d="M400.063,349.723c0,0-21.094,19.703-26.063,25.781c-1.891,2.313-3.328,5.063-4.094,8.141 c-2.844,11.219,3.969,22.609,15.188,25.438c11.203,2.813,22.594-3.985,25.422-15.204c0.766-3.078,0.813-6.172,0.25-9.109 C409.281,377.067,400.063,349.723,400.063,349.723z"></path>
          <path
            className="st0"
            d="M375.125,448.646c0,0-21.063,19.703-26.063,25.797c-1.891,2.313-3.313,5.063-4.094,8.141 c-2.813,11.203,3.969,22.594,15.188,25.406c11.219,2.844,22.594-3.953,25.422-15.172c0.781-3.078,0.828-6.188,0.266-9.094 C384.328,475.989,375.125,448.646,375.125,448.646z"></path>
        </g>
      </g>
    </svg>
  );
}

function Stormy() {
  return (
    <svg
      fill="#000000"
      preserveAspectRatio="xMidYMid meet"
      className="iconify iconify--emojione"
      role="img"
      aria-hidden="true"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64">
      <g strokeWidth="0" id="SVGRepo_bgCarrier"></g>
      <g
        strokeLinejoin="round"
        strokeLinecap="round"
        id="SVGRepo_tracerCarrier"></g>
      <g id="SVGRepo_iconCarrier">
        <g fill="#75d6ff">
          <path d="M10.8 42.9c-.5 1.5-.1 3 1 3.4c1.1.4 2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.9-3.6 3.8-4.2 5.5"></path>
          <path d="M13.2 57.4c.6-1.8.7-4.1.2-6.9c-2.1 1.8-3.6 3.7-4.2 5.5c-.5 1.5-.1 3 1 3.4c1.1.4 2.5-.5 3-2"></path>
          <path d="M51.5 37.4c-2.1 1.8-3.6 3.7-4.2 5.5c-.5 1.5-.1 3 1 3.4c1.1.4 2.4-.5 3-2c.5-1.7.6-4.1.2-6.9"></path>
          <path d="M38.2 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2 1.9-3.5 3.8-4.2 5.5"></path>
          <path d="M46.9 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.9-3.6 3.8-4.2 5.5"></path>
          <path d="M18.6 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.9-3.6 3.8-4.2 5.5"></path>
        </g>
        <path
          d="M24.5 31.9l-4.9 16.2h12.5L27.9 62l16.5-20.2H32.5l2.9-9.9z"
          fill="#ffce31"></path>
        <path
          fill="#ffffff"
          d="M18.2 32.5c-.8 0-1.6-.1-2.4-.4c-3.1-1-5.3-3.9-5.3-7.2c0-2.2 1-4.3 2.6-5.7c.4-.4.9-.7 1.4-1l.5-1.8c1.3-4.4 5.4-7.5 10-7.5c.5 0 .9 0 1.5.1c.4.1.8.1 1.2.3l.2-.4c1.9-3.3 5.4-5.4 9.2-5.4C43 3.5 47.7 8.2 47.7 14v1c.4.2.9.4 1.3.6c2.8 1.6 4.5 4.6 4.5 7.8c0 4.2-2.9 7.8-7 8.8c-.7.2-1.4.2-2 .2H18.2z"></path>
        <path
          fill="#b6c1d1"
          d="M37.1 5c5 0 9 4 9 8.9v.7c-2.1.2-4 1-5.4 2.3c1.1-.6 2.4-1 3.7-1c.5 0 1 .1 1.5.1c.8.2 1.6.5 2.3.9c2.3 1.3 3.8 3.7 3.8 6.5c0 3.6-2.5 6.5-5.8 7.3c-.7.2-1.2.3-1.8.3H18.2c-.7 0-1.3-.1-1.9-.3c-2.4-.8-4.2-3.1-4.2-5.8c0-1.8.8-3.5 2.1-4.6c.6-.5 1.3-.9 2-1.2c.6-.2 1.3-.3 2-.3c2 0 3.7.9 4.9 2.4h.1c-1.3-2.4-3.7-4.1-6.6-4.3c1.1-3.7 4.5-6.4 8.5-6.4c.4 0 .9 0 1.3.1c.8.1 1.6.3 2.3.7c2.7 1.2 4.7 3.7 5.1 6.8V18c0-3.4-1.8-6.5-4.5-8.3C30.8 6.9 33.8 5 37.1 5m0-3C33 2 29.2 4.1 27 7.6h-.3c-.6-.1-1.2-.1-1.7-.1c-5.3 0-10 3.5-11.4 8.6l-.3 1.2c-.4.2-.7.5-1.1.8c-2 1.7-3.1 4.2-3.1 6.9c0 4 2.5 7.4 6.3 8.7c.9.3 1.9.5 2.9.5h26.2c.8 0 1.6-.1 2.4-.3c4.8-1.1 8.2-5.3 8.2-10.3c0-3.8-2-7.3-5.3-9.1c-.2-.1-.3-.2-.5-.3v-.1C49.2 7.4 43.8 2 37.1 2z"></path>
      </g>
    </svg>
  );
}

function Sunny() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      fill="#000000">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fill="#ffce31"
          d="M512 704a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512zm0-704a32 32 0 0 1 32 32v64a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 768a32 32 0 0 1 32 32v64a32 32 0 1 1-64 0v-64a32 32 0 0 1 32-32zM195.2 195.2a32 32 0 0 1 45.248 0l45.248 45.248a32 32 0 1 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm543.104 543.104a32 32 0 0 1 45.248 0l45.248 45.248a32 32 0 0 1-45.248 45.248l-45.248-45.248a32 32 0 0 1 0-45.248zM64 512a32 32 0 0 1 32-32h64a32 32 0 0 1 0 64H96a32 32 0 0 1-32-32zm768 0a32 32 0 0 1 32-32h64a32 32 0 1 1 0 64h-64a32 32 0 0 1-32-32zM195.2 828.8a32 32 0 0 1 0-45.248l45.248-45.248a32 32 0 0 1 45.248 45.248L240.448 828.8a32 32 0 0 1-45.248 0zm543.104-543.104a32 32 0 0 1 0-45.248l45.248-45.248a32 32 0 0 1 45.248 45.248l-45.248 45.248a32 32 0 0 1-45.248 0z"></path>
      </g>
    </svg>
  );
}

function Windy() {
  return (
    <svg
      fill="#ffffff"
      viewBox="-6.4 -6.4 76.80 76.80"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#ffffff"
      strokeWidth="0.00064"
      transform="matrix(1, 0, 0, 1, 0, 0)rotate(0)">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#b6c1d1"
        strokeWidth="4.4799999999999995">
        <title></title>
        <g id="Windy">
          <path d="M55.9775,24.2549A12.0171,12.0171,0,0,0,44,13a12.1822,12.1822,0,0,0-1.68.1162,14.9911,14.9911,0,0,0-27.458,1.8848A8.0093,8.0093,0,0,0,7,23a7.7816,7.7816,0,0,0,.0537.916A9.0645,9.0645,0,0,0,2,32a8.8714,8.8714,0,0,0,1.2188,4.5078A.9986.9986,0,0,0,4.08,37H59.74a.9993.9993,0,0,0,.8194-.4268A7.9408,7.9408,0,0,0,62,32,8.0292,8.0292,0,0,0,55.9775,24.2549Z"></path>
          <path d="M12.7725,44.0225,13,45l-.3066-.9521a.9608.9608,0,0,0-.6016,1.24,1.0406,1.0406,0,0,0,1.2959.6367.9407.9407,0,0,1,1.1953.6563.9039.9039,0,0,1-.5332,1.23,3.0783,3.0783,0,0,1-1.7832.1035A3.0031,3.0031,0,0,1,13,42H37a1,1,0,0,0,0-2H13a5.0027,5.0027,0,0,0-1.1855,9.8633,5.2691,5.2691,0,0,0,1.1845.1357,4.987,4.987,0,0,0,1.752-.3144,3.002,3.002,0,0,0-1.9785-5.6621Z"></path>
          <path d="M35.9639,51H26.0361a4.0014,4.0014,0,0,0-.9472,7.89,4.1685,4.1685,0,0,0,.9463.11,3.98,3.98,0,0,0,1.4-.2529,2.5013,2.5013,0,0,0-1.624-4.7256c-.0127.0039-.0918.0293-.1035.0342a.97.97,0,0,0-.5879,1.247,1.0269,1.0269,0,0,0,1.2813.63.4437.4437,0,0,1,.5849.334.4271.4271,0,0,1-.2509.6074,2.0692,2.0692,0,0,1-1.1934.0684,1.9757,1.9757,0,0,1-1.45-1.4561A2.0051,2.0051,0,0,1,26.0361,53h9.9278a1,1,0,0,0,0-2Z"></path>
          <path d="M51,45H25a1,1,0,0,0,0,2H51a3.0024,3.0024,0,0,1,.7344,5.9141,3.09,3.09,0,0,1-1.7842-.1026.9039.9039,0,0,1-.5332-1.23.9272.9272,0,0,1,1.1777-.6622l.0987.0332a1,1,0,0,0,.6132-1.9042l-.0966-.0313a3.0024,3.0024,0,0,0-1.961,5.668,4.9992,4.9992,0,0,0,1.752.3144,5.2222,5.2222,0,0,0,1.1855-.1367,4.9507,4.9507,0,0,0,3.68-3.6924A5.0068,5.0068,0,0,0,51,45Z"></path>
        </g>
      </g>
      <g id="SVGRepo_iconCarrier">
        <title></title>
        <g id="Windy">
          <path d="M55.9775,24.2549A12.0171,12.0171,0,0,0,44,13a12.1822,12.1822,0,0,0-1.68.1162,14.9911,14.9911,0,0,0-27.458,1.8848A8.0093,8.0093,0,0,0,7,23a7.7816,7.7816,0,0,0,.0537.916A9.0645,9.0645,0,0,0,2,32a8.8714,8.8714,0,0,0,1.2188,4.5078A.9986.9986,0,0,0,4.08,37H59.74a.9993.9993,0,0,0,.8194-.4268A7.9408,7.9408,0,0,0,62,32,8.0292,8.0292,0,0,0,55.9775,24.2549Z"></path>
          <path d="M12.7725,44.0225,13,45l-.3066-.9521a.9608.9608,0,0,0-.6016,1.24,1.0406,1.0406,0,0,0,1.2959.6367.9407.9407,0,0,1,1.1953.6563.9039.9039,0,0,1-.5332,1.23,3.0783,3.0783,0,0,1-1.7832.1035A3.0031,3.0031,0,0,1,13,42H37a1,1,0,0,0,0-2H13a5.0027,5.0027,0,0,0-1.1855,9.8633,5.2691,5.2691,0,0,0,1.1845.1357,4.987,4.987,0,0,0,1.752-.3144,3.002,3.002,0,0,0-1.9785-5.6621Z"></path>
          <path d="M35.9639,51H26.0361a4.0014,4.0014,0,0,0-.9472,7.89,4.1685,4.1685,0,0,0,.9463.11,3.98,3.98,0,0,0,1.4-.2529,2.5013,2.5013,0,0,0-1.624-4.7256c-.0127.0039-.0918.0293-.1035.0342a.97.97,0,0,0-.5879,1.247,1.0269,1.0269,0,0,0,1.2813.63.4437.4437,0,0,1,.5849.334.4271.4271,0,0,1-.2509.6074,2.0692,2.0692,0,0,1-1.1934.0684,1.9757,1.9757,0,0,1-1.45-1.4561A2.0051,2.0051,0,0,1,26.0361,53h9.9278a1,1,0,0,0,0-2Z"></path>
          <path d="M51,45H25a1,1,0,0,0,0,2H51a3.0024,3.0024,0,0,1,.7344,5.9141,3.09,3.09,0,0,1-1.7842-.1026.9039.9039,0,0,1-.5332-1.23.9272.9272,0,0,1,1.1777-.6622l.0987.0332a1,1,0,0,0,.6132-1.9042l-.0966-.0313a3.0024,3.0024,0,0,0-1.961,5.668,4.9992,4.9992,0,0,0,1.752.3144,5.2222,5.2222,0,0,0,1.1855-.1367,4.9507,4.9507,0,0,0,3.68-3.6924A5.0068,5.0068,0,0,0,51,45Z"></path>
        </g>
      </g>
    </svg>
  );
}

function Cloudy() {
  return (
    <svg
      version="1.1"
      id="_x32_"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      fill="#75d6ff">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g>
          <path
            className="st0"
            style={{ fill: '#ffffff' }}
            d="M464.625,129.004c-20.281-20.109-47.094-31.391-75.563-31.766l-9.625-0.125l-2.141-9.359 c-5.703-24.813-19.891-47.25-39.953-63.234C316.703,8.161,291.859-0.324,265.469,0.004c-26.688,0.391-51.5,9.703-71.813,26.953 c-19.75,16.828-33.219,40.047-37.938,65.359l-2.188,11.703l-11.813-1.891c-6.781-1.063-12.922-1.547-18.813-1.469 c-29.063,0.406-56.281,12.109-76.656,32.984c-20.297,20.891-31.25,48.406-30.891,77.5c0.406,29.078,12.109,56.297,32.984,76.688 c20.906,20.281,48.422,31.266,77.5,30.875l263.25-3.531c29.063-0.406,56.281-12.109,76.656-32.984 c20.281-20.906,31.25-48.438,30.891-77.516C496.234,176.129,484.875,149.286,464.625,129.004z"></path>
        </g>
      </g>
    </svg>
  );
}
