import { useEffect, useRef, useState } from "react";
import StarsBox from "./StarsBox";

let KEY = "9afe2a16";

export default function App() {
  const [search, setSearch] = useState("");
  const [moviesData, setMoviesData] = useState([]);
  const [movieNumber, setMovieNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [textError, setTextError] = useState("");

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovie() {
        try {
          setIsLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${search}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error(""); // offline hast karbar ya na?

          const data = await res.json();

          if (data.Response === "False")
            // on kalamye ke dakhele search bar search kardid eshtebah bashe behemon response false bermigardone.
            throw new Error("Your desired movie was not found");

          setTextError("");
          setMoviesData(data.Search);
        } catch (err) {
          setMoviesData([]);

          if (err.message !== "The user aborted a request.")
            setTextError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      if (search) fetchMovie();

      return function () {
        controller.abort();
      };
    },
    [search]
  );

  return (
    <section>
      <Navbar
        moviesData={moviesData}
        setMoviesData={setMoviesData}
        setSearch={setSearch}
        movieNumber={movieNumber}
        setMovieNumber={setMovieNumber}
        setTextError={setTextError}
        setIsLoading={setIsLoading}
      />
      <Main
        moviesData={moviesData}
        isLoading={isLoading}
        textError={textError}
      />
    </section>
  );
}

function Navbar({
  setSearch,
  movieNumber,
  setMovieNumber,
  moviesData,
  setMoviesData,
  setTextError,
  setIsLoading,
}) {
  setMovieNumber(moviesData.length);

  function onChangeFunc(e) {
    if (e.target.value.trim().length > 2) {
      setSearch(e.target.value.toLowerCase().trim());
    } else {
      setMoviesData([]);
      setSearch("");
      setTextError("");
      setIsLoading(false);
    }
  }

  const inputEl = useRef(null);

  useEffect(() => {
    inputEl.current.focus();
  }, []);

  return (
    <div id="navbar">
      <h1 id="title"> 🍿usePopcorn </h1>
      <input
        id="searchBox"
        placeholder="Search movies..."
        onChange={onChangeFunc}
        ref={inputEl}
      />
      <p id="foundText">
        Found <strong>{movieNumber}</strong> result
      </p>
    </div>
  );
}

function Main({ moviesData, isLoading, textError }) {
  const [movie, setMovie] = useState(null);
  const [selectMovie, setSelectMovie] = useState("");

  function clickOnMovie(imdb) {
    fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${imdb}`)
      .then((res) => res.json())
      .then((data) => {
        setMovie(data);
        setSelectMovie(imdb);
      });
  }

  return (
    <div id="main">
      <Movielist
        clickOnMovie={clickOnMovie}
        moviesData={moviesData}
        isLoading={isLoading}
        textError={textError}
        selectMovie={selectMovie}
      />
      <Informationlist
        movie={movie}
        setMovie={setMovie}
        setSelectMovie={setSelectMovie}
      />
    </div>
  );
}

function Movielist({
  clickOnMovie,
  moviesData,
  isLoading,
  textError,
  selectMovie,
}) {
  const [isOpen1, setIsOpen1] = useState(true);

  return (
    <div
      className={`movieList ${
        isLoading ? "style-loading" : textError ? "style-error" : ""
      }`}
    >
      <button onClick={() => setIsOpen1(!isOpen1)}>
        {isOpen1 ? "-" : "+"}
      </button>
      {isOpen1 &&
        moviesData.length !== 0 &&
        moviesData.map((item) => (
          <Movie
            item={item}
            clickOnMovie={clickOnMovie}
            selectMovie={selectMovie}
          />
        ))}

      {isLoading && isOpen1 && moviesData.length === 0 && <Loader />}
      {textError !== "" && isOpen1 && !isLoading && (
        <ErrorText textError={textError} />
      )}
    </div>
  );
}

function ErrorText({ textError }) {
  return <p id="text-Error"> ⛔️ {textError} </p>;
}

function Loader() {
  return <p id="text-loading"> ⏳ Loading... </p>;
}

function Movie({ item, clickOnMovie, selectMovie }) {
  return (
    <div
      className={`movie ${item.imdbID === selectMovie ? "selected" : ""}`}
      onClick={() => clickOnMovie(item.imdbID)}
    >
      <img src={item.Poster} alt="poster img" />
      <div>
        <h3> {item.Title} </h3>
        <h3> 📅 {item.Year} </h3>
      </div>
    </div>
  );
}

function Informationlist({ movie, setMovie, setSelectMovie }) {
  const [isOpen2, setIsOpen2] = useState(true);
  const [movieWatchedS, setMovieWatchedS] = useState(function () {
    const x = localStorage.getItem("watched");
    return x ? JSON.parse(x) : [];
  });
  const [imdb, setImdb] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    imdb && currentRef.current++;
  }, [imdb]);

  function sendMovieInformation(imdb, movie) {
    setMovie(null);

    const movieWatched = {
      name: movie.Title,
      image: movie.Poster,
      movieImdb: movie.imdbRating === "N/A" ? 0 : Number(movie.imdbRating),
      personalImdb: imdb,
      imdbId: movie.imdbID,
      time: movie.Runtime === "N/A" ? "0" : movie.Runtime,
    };

    const result = movieWatchedS.some((item) => item.imdbId === movie.imdbID);
    !result && setMovieWatchedS([...movieWatchedS, movieWatched]);
  }

  function removeMovieWatched(imdbId) {
    const removeMovieWatchedFilter = movieWatchedS.filter(
      (item) => item.imdbId !== imdbId
    );
    setMovieWatchedS(removeMovieWatchedFilter);
  }

  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(movieWatchedS));
  }, [movieWatchedS]);

  useEffect(() => {
    movie
      ? (document.title = `movie | ${movie.Title}`)
      : (document.title = "usePopcorn");
  }, [movie]);

  document.addEventListener("keydown", function (e) {
    if (e.code === "Escape" && movie) {
      setMovie(null);
      setSelectMovie("");
    }
  });

  return (
    <div id="informationList">
      <button id="negativeButton" onClick={() => setIsOpen2(!isOpen2)}>
        {" "}
        {isOpen2 ? "-" : "+"}{" "}
      </button>

      {movie
        ? isOpen2 && (
            <MovieInformation
              movie={movie}
              setMovie={setMovie}
              sendMovieInformation={sendMovieInformation}
              setSelectMovie={setSelectMovie}
              movieWatchedS={movieWatchedS}
              key={movie.imdbID}
              setImdb={setImdb}
              imdb={imdb}
            />
          )
        : isOpen2 && (
            <MoviesInformation
              movieWatchedS={movieWatchedS}
              removeMovieWatched={removeMovieWatched}
            />
          )}
    </div>
  );
}

function MoviesInformation({ movieWatchedS, removeMovieWatched }) {
  let totalImdb = 0,
    totalPersonalImdb = 0,
    totalMovieTime = 0;

  movieWatchedS.forEach((item) => {
    totalImdb = totalImdb + item.movieImdb;
    totalPersonalImdb = totalPersonalImdb + item.personalImdb;
    const runTime = item.time;
    let runTimeToArray = runTime.split(" ");
    totalMovieTime =
      totalMovieTime + Number(runTimeToArray.splice(0, 1).join(""));
  });

  const divisionNumber = movieWatchedS.length > 0 ? movieWatchedS.length : 1;

  return (
    <div id="moviesInformation">
      <div id="upperPart">
        <h3> MOVIES YOU WATCHED </h3>
        <div>
          <p> 🎦 {movieWatchedS.length} Movie </p>
          <p> ⭐️ {(totalImdb / divisionNumber).toFixed(2)} </p>
          <p> 🌟 {(totalPersonalImdb / divisionNumber).toFixed(2)} </p>
          <p> ⌛️ {(totalMovieTime / divisionNumber).toFixed(2)} min </p>
        </div>
      </div>
      <div id="lowerPart">
        {movieWatchedS.map((item) => {
          return (
            <div id="movieWatched">
              <div id="headerImage">
                <img src={item.image} alt="movie poster" />
              </div>
              <div id="header-name-numbers">
                <p id="nameMovieWatched"> {item.name} </p>
                <p id="informationMovieWatched">
                  {" "}
                  ⭐{item.movieImdb} 🌟{item.personalImdb} ⏳{item.time}{" "}
                </p>
              </div>
              <svg
                onClick={() => removeMovieWatched(item.imdbId)}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MovieInformation({
  movie,
  setMovie,
  sendMovieInformation,
  setSelectMovie,
  movieWatchedS,
  setImdb,
  imdb,
}) {
  let { Released } = movie;
  let [day, month, year] = Released.split(" ");
  let movieReleased =
    Released !== "N/A" ? `${day} ${month} | ${year}` : "Not available";

  function getImdbNumber(rating) {
    setImdb(rating);
  }

  const trueOrFalse = movieWatchedS.some(
    (item) => item.imdbId === movie.imdbID
  );

  return (
    <div id="movieInformation">
      <div id="upperPart">
        <svg
          onClick={() => {
            setMovie(null);
            setSelectMovie("");
          }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          id="icon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>
        <img src={movie.Poster} alt={movie.Title} />
        <div>
          <h2> {movie.Title} </h2>
          <h3>
            {movieReleased} |{" "}
            {movie.Runtime === "N/A" ? "Not available" : movie.Runtime}{" "}
          </h3>
          <h3> {movie.Genre === "N/A" ? "Not available" : movie.Genre} </h3>
          <h3 style={{ marginLeft: "-4px", marginTop: "1.1rem" }}>
            ⭐️ {movie.imdbRating === "N/A" ? "0" : movie.imdbRating} IMDb
            rating
          </h3>
        </div>
      </div>
      <div id="lowerPart">
        <div className="stars-box" style={{ height: imdb ? "7rem" : "5rem" }}>
          {!trueOrFalse ? (
            <>
              <StarsBox maxRating={10} getImdbNumber={getImdbNumber} />
              <button
                className={`addToListBtn ${!imdb ? "hidden" : ""}`}
                onClick={() => {
                  sendMovieInformation(imdb, movie);
                  setSelectMovie("");
                }}
              >
                {" "}
                + Add to List{" "}
              </button>
            </>
          ) : (
            <h4> You have already set imdb for this movie 🙂 </h4>
          )}
        </div>
        <p id="movieDescription">
          {movie.Plot === "N/A" ? "Not available" : movie.Plot}
        </p>
        <p id="movieActors">
          {" "}
          <strong> Actors:</strong>{" "}
          {movie.Actors === "N/A" ? "Not available" : movie.Actors}{" "}
        </p>
        <p id="movieWriter">
          {" "}
          <strong> Directed By:</strong>{" "}
          {movie.Writer === "N/A" ? "Not available" : movie.Writer}{" "}
        </p>
      </div>
    </div>
  );
}
