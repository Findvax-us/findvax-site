# Jabzone Site

## Website for displaying vaccine availability

This is the frontend for data retrieved by https://github.com/pettazz/findvax-scraper

### Run it locally

1. It's all node just go get node however one does that I dunno
2. `npm i` -> Everything is in the production profile because there's no "dev" version of this thing and an un-compressed build takes forever but prod takes like 10s
3. `tools/webpack-watch` -> runs both a static http server out of ./dist and the `webpack --watch` build, which will regenerate every time a change is detected
4. You'll need some test data, change the urls in `src/config.js` to some relevant json files. Like maybe from https://github.com/pettazz/findvax-data. You can use the same http server from this project to host the static files with something like `./node_modules/http-server/bin/http-server ../findvax-data/MA -p 8888 --cors`, which would change your data urls to `http://localhost:8888/locations.json`.

### TODO

- Auto-refresh every 5m
- Right now doesn't care about states because all the data is from MA, so it needs to be able to switch between them, including choosing an appropriate `locations.json`, depending on how the scraper outputs that stuff by state. `locations-MA.json` and `availability-MA.json`? It's an open question over there too.
- All those tailwind classes all over everything sure could get cleaned up into the `index.css` file I bet
- Some button to switch between available languages?
- Accessibility a11y stuff: mostly semantically not bad, but could be better. No aria attributes (especially modals and buttons), judicious use of `.sr-only`, keyboard navigation seems to be missing a lot of highlights, etc
- Test in browsers: I don't think IE11 is gonna make the cut here, just nothing supports it anymore. But also I don't have a ton of browsers handy to test in so anything would be useful
- Noscript? Detect this and show a flat print version somehow?

### Stuff it uses

- The Braille Institute's [Atkinson Hyperlegible Font](https://brailleinstitute.org/freefont)
- Airbnb's [Polyglot](https://github.com/airbnb/polyglot.js)
- [Alpine.js](https://github.com/alpinejs/alpine)
- [Spruce](https://github.com/ryangjchandler/spruce)s
- [Tailwind CSS](https://tailwindcss.com)
- [Font Awesome](https://fontawesome.com)
- [webpack](https://webpack.js.org)