# Saper

Zadanie rekrutacyjne — Frontend Developer (Interia). Saper z planszami wczytywanymi z
`src/data/saper-plansze.json`.

Działające demo: **https://interia-task.vercel.app/**

## 1. Jak uruchomić

Wymagany Node w wersji `^20.19.0 || >=22.12.0` (starsze `20.x`, np. `20.18`, mają problem z
natywnym bindingiem Rolldowna używanym przez Vite 8 — `npm install` przechodzi, ale `vite`/`vitest`
wywalają się przy starcie). Jeśli używasz nvm: `nvm use 22`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build, wynik w dist/
npm run test     # vitest run — testy logiki z src/logic/board.ts
```

Sprawdzone na czystym klonie (`git clone` do pustego katalogu, `npm install`, `npm run build`,
`npm run test`) — wszystkie trzy komendy przechodzą bez dodatkowej konfiguracji.

## 2. Co zrobiłeś, a czego nie

Zrobione: cały wymagany zakres. `src/logic/board.ts` z narzuconym kontraktem (`Level`/`Cell`/`Board`,
`createBoard`/`revealCell`/`toggleFlag`), pierwsze bezpieczne odkrycie z przenoszeniem miny, kaskada
respektująca flagi, chording, wygrana/przegrana z blokadą dalszych ruchów, licznik min, wybór
planszy z listy i restart, style w SCSS/CSS Modules z konwencją BEM i zmiennymi CSS w jednym pliku,
11 testów (cztery wymagane kategorie plus kilka dodatkowych pod dane wejściowe i chording).
Flagowanie działa też na dotyku przez ręcznie zaimplementowane przytrzymanie (`onTouchStart` +
timer 450ms w `Cell.tsx`) — na prawdziwym telefonie długi dotyk nie wysyła natywnego `contextmenu`
tak jak emulacja dotyku w devtoolsach na komputerze, więc poleganie na tym samym handlerze co dla
prawego przycisku myszy nie działało poza devtoolsami; w UI jest krótka instrukcja tłumacząca to
sterowanie.

Nie zrobione świadomie: brak obsługi klawiatury (strzałki + spacja/flaga) — dodałbym to jako
pierwsze usprawnienie dostępności, ale nie było w zakresie i gra działa w pełni myszką. Brak
zapisu stanu gry (np. w `localStorage`) — po odświeżeniu strony gra startuje od nowa na pierwszej
planszy z listy; też świadomie pominięte jako rozszerzenie zakresu.

## 3. Co znalazłeś w danych

Plik `saper-plansze.json` ma kilka celowych usterek, które sprawdziłem przed pisaniem kodu:

- `rachmistrz`: `mineCount: 10`, ale lista `mines` zawiera 12 pozycji — pole `mineCount` jest
  niewiarygodne, więc logika w ogóle go nie używa; liczbę min (i licznik w UI) liczę zawsze z
  faktycznej zawartości `cells`.
- `bliznieta`: współrzędna `[2,2]` powtórzona dwukrotnie — miny są deduplikowane po indeksie
  komórki przed zbudowaniem planszy.
- `za-plotem`: mina `[8,3]` przy `width: 8` (poprawny zakres x to 0–7) — współrzędne poza planszą
  są odrzucane, nie powodują wyjątku ani przesunięcia indeksów.
- `ciasno`: plansza 3×3 z 9 minami — każde pole jest miną. Reguła "pierwsze odkrycie jest
  bezpieczne" nie ma gdzie przenieść miny (brak wolnego pola), więc zgodnie z treścią zadania mina
  zostaje na miejscu i gracz przegrywa na pierwszym kliknięciu. Grywalne, tylko nudne.
- `laka`: 0 min — trywialna, natychmiastowa wygrana po jednym kliknięciu.

Wszystko to obsługuje `normalizeMines()` w `board.ts` (dedupe + filtr zakresu) i sama logika
pierwszego odkrycia (obsługa braku wolnego pola). Żaden z siedmiu poziomów nie wywala gry — jest to
pokryte testem iterującym po całym pliku.

## 4. Co było najtrudniejsze

Największy zgryz to chording przy tylko trzech dozwolonych eksportach. Zamiast dodawać czwartą
funkcję, `revealCell` wywołane na już odkrytym polu z cyfrą przełącza się w tryb chordingu — jeśli
liczba flag dookoła zgadza się z cyfrą, odkrywa resztę sąsiadów tą samą ścieżką co zwykłe odkrycie
(więc błędnie postawiona flaga naturalnie kończy się przegraną, bez dodatkowego kodu na ten
przypadek). Druga decyzja: przy przegranej nie ustawiam `revealed: true` na wszystkich minach w
logice (nie ma na to pola w kontrakcie) — widok sam pokazuje `cell.mine` gdy `state === 'lost'`,
niezależnie od `revealed`.

Poza logiką: `npm install` na Node 20.18 kończyło się cichym `EBADENGINE`, a `vitest`/`vite dev`
wywalały się dopiero przy starcie błędem o brakującym natywnym bindingu Rolldowna (`Cannot find
native binding`). Zająłem się tym, przełączając się na Node 22 przez nvm i dopisując `engines` w
`package.json`, żeby ten sam problem nie zaskoczył recenzenta.

## 5. Jakich bibliotek użyłeś i po co

- **React 19 + ReactDOM** — wymagane w zadaniu, warstwa widoku.
- **Vite + @vitejs/plugin-react** — bundler/dev server, dokładnie ten starter, który sugeruje
  treść zadania (`npm create vite -- --template react-ts`).
- **sass** — kompilacja SCSS, wymagana przez ograniczenia stylistyczne zadania.
- **vitest** — runner testów. Zerowa dodatkowa konfiguracja przy Vite, domyślne środowisko `node`
  wystarcza, bo testowane są czyste funkcje z `board.ts`, a nie komponenty (środowisko `jsdom` nie
  było potrzebne, więc go nie dodałem).
- **TypeScript + ESLint (typescript-eslint, react-hooks, react-refresh)** — część domyślnego
  scaffoldu Vite, zostawione dla jakości kodu; `npm run lint` przechodzi bez ostrzeżeń.

Poza tym żadnych bibliotek UI, state-managementu ani narzędziowych — stan gry trzyma jeden
`useReducer` w `src/hooks/useGame.ts`, co przy tej skali (jedna plansza na raz, kilka akcji) było
prostsze niż wprowadzanie zewnętrznej biblioteki do zarządzania stanem.

## 6. Co zrobiłbyś dalej

Pod produkcję: `React.memo` na komórce (przy większych planszach re-renderuje się cała siatka przy
każdym ruchu, bo `Board` mapuje świeżą tablicę `cells`), obsługa klawiatury i lepsze `aria-live` dla
statusu gry, zapis postępu w `localStorage`, animacje odkrycia/kaskady, dźwięk, licznik czasu i
najlepsze wyniki per plansza, oraz test komponentów (np. Testing Library) obok testów samej logiki
— zadanie explicite prosiło o testowanie funkcji, nie klikania w interfejs, więc tego celowo nie
dodałem teraz.

## 7. Gdzie korzystałeś z AI

Całość — logikę w `board.ts`, komponenty, style i testy — napisałem z Claude Code jako
asystentem: ja dostarczałem specyfikację (treść zadania, `saper-plansze.json`) i decyzje
projektowe (m.in. jak wcisnąć chording w trzy dozwolone eksporty, jak obsłużyć usterki danych,
dobór kolorów), AI generowało kod na tej podstawie, a ja go czytałem, uruchamiałem w przeglądarce
(ręczne testy każdej planszy z listy, w tym `ciasno` i `łąka`) i poprawiałem, gdzie się mylił —
m.in. jeden z testów jednostkowych miał błędne oczekiwanie (plansza 2×1 z jedną miną wygrywa od
razu po pierwszym bezpiecznym odkryciu, bo zostaje tylko jedno bezpieczne pole) i błąd z natywnym
bindingiem Rolldowna na starszym Node.
