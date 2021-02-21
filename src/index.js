import '@ryangjchandler/spruce';
import 'alpinejs';

import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faCalendarPlus, 
         faBell, 
         faExclamationTriangle, 
         faMapMarkedAlt, 
         faExternalLinkAlt,
         faSearch,
         faHeadSideMask,
         faInfoCircle,
         faHandsHelping,
         faVirusSlash,
         faTimesCircle,
         faCheckCircle } from "@fortawesome/free-solid-svg-icons";

library.add(faCalendarPlus, 
            faBell, 
            faExclamationTriangle, 
            faMapMarkedAlt, 
            faExternalLinkAlt,
            faSearch,
            faHeadSideMask,
            faInfoCircle,
            faHandsHelping,
            faVirusSlash,
            faTimesCircle,
            faCheckCircle);
dom.watch();

import Polyglot from 'node-polyglot';

import './index.css';

import { localei18n, shortLang } from './lang.js';

const locationsURL = 'https://data.findvax.us/MA/locations.json';
const availabilityURL = 'https://data.findvax.us/MA/availability.json';

const polyglot = new Polyglot({phrases: localei18n});
window.t = (key) => polyglot.t(key);

window.notificationsEnabled = true;

window.isApple = () => /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) || navigator.platform === 'MacIntel';
window.getMapsUrl = (address) =>{
  // try to guess whether this is a device with Apple Maps, so that it will open that automatically instead
  const urlAddr = encodeURI(address);
  if(isApple){
    return 'http://maps.apple.com/?address=' + urlAddr;
  }else{
    return 'https://www.google.com/maps/search/?api=1&query=' + urlAddr;
  }
}

// really polluting the window scope here but, 
//                                         meh

window.Spruce.store('modals', {
  about: {
    open: false,
  },
  contributing: {
    open: false,
  },
  isAnyOpen(){
    return true && (this.about.open || this.contributing.open);
  }
});
// overengineered? maybe. who's to say. 

window.localizeDate = (dateISOString, includeTime = false) => {
  let opts = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  if(includeTime){
    opts.hour = 'numeric';
    opts.minute = 'numeric';
  }
  return new Date(dateISOString).toLocaleString(shortLang, opts);
}

window.locationsController = () => {
  return {
    errorState: false,
    isLoading: true,

    filterShowOnlyAvailable: true,
    filterZip: null,
    filterSearch: null,

    locationAvailability: [],
    zipCodes: new Set(),

    filteredLocationAvailability: [],

    fetchLocations(){
      let data = {};

      Promise.all([
        fetch(locationsURL)
          .then(res => res.json())
          .then(json => data.locations = json)
          .catch(err => {
            console.error(err);
          }),
        fetch(availabilityURL)
          .then(res => res.json())
          .then(json => data.availability = json)
          .catch(err => {
            console.error(err);
          })
      ]).then(() => {
        this.locationAvailability = data.locations.map((location) => {
          location.availability = data.availability.find(avail => avail.location === location.uuid) || null;

          this.zipCodes.add(location.zip);

          // shortcuts for easier reference later
          location.hasAvailability = location.availability && 
                                     location.availability.times && 
                                     location.availability.times.length > 0;
          location.siteInstructions = location.siteInstructions.trim();
          location.accessibility = location.accessibility.trim();
          if(location.availability){
            location.lastUpdatedString = window.t('ui.updated') + ' ' + 
                                         Math.floor(
                                          (new Date().getTime() - new Date(location.availability.fetched).getTime()) 
                                          / (1000 * 60)
                                        ) + ' ' + window.t('ui.mins-ago');
          }

          return location;
        });
        this.filterLocations();

        this.isLoading = false;
      }).catch(err => {
        console.log(err);
        this.isLoading = false;
        this.errorState = true;
      });
    },

    filterLocations(){
      this.filteredLocationAvailability = this.locationAvailability.filter((location) => {
        let valid = true;

        if(this.filterShowOnlyAvailable){
          valid = valid && location.hasAvailability;
        }

        if(this.filterZip && this.filterZip !== 'any'){
          valid = valid && location.zip === this.filterZip;
        }

        if(this.filterSearch){
          const textContent = `${location.name} ${location.address} ${location.siteInstructions} ${location.accessibility}`;

          valid = valid && textContent.toLowerCase().includes(this.filterSearch.toLowerCase());
        }

        return valid;
      })
    }
  }
}