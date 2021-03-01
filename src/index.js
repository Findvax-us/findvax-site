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
         faCheckCircle,
         faStream } from "@fortawesome/free-solid-svg-icons";

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
            faCheckCircle,
            faStream);
dom.watch();

import Polyglot from 'node-polyglot';

import './index.css';

import { localei18n, shortLang } from './lang.js';

import config from './config.js';

const polyglot = new Polyglot({phrases: localei18n});
window.t = (key) => polyglot.t(key);

window.notificationsEnabled = config.notificationsEnabled;

window.isApple = () => /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) || navigator.platform === 'MacIntel';
window.getMapsUrl = (address) =>{
  // try to guess whether this is a device with Apple Maps, so that it will open that automatically instead
  const urlAddr = encodeURI(address);
  if(window.isApple()){
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
  notify: {
    open: false,
  },
  activity: {
    open: false,
    state: 'loading' // one of: loading, failure, success
  },
  isAnyOpen(){
    return true && (this.about.open || this.contributing.open || this.notify.open || this.activity.open);
  }
});
// overengineered? maybe. who's to say. 
Spruce.watch('modals.activity.open', value => {
  if(!value){
    //whenever we close, revert back to default loading state
    window.Spruce.stores.modals.activity.state = 'loading';
  }
});

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
    zipCodes: [],

    filteredLocationAvailability: [],

    fetchLocations(){
      let data = {};

      Promise.all([
        fetch(config.locationsURL)
          .then(res => res.json())
          .then(json => data.locations = json),
        fetch(config.availabilityURL)
          .then(res => res.json())
          .then(json => data.availability = json)
      ]).then(() => {
        let anyAvailability = false;

        if(data.locations && data.locations.length > 0){
          let zipCodeSet = new Set();

          this.locationAvailability = data.locations.map((location) => {
            location.availability = data.availability.find(avail => avail.location && avail.location === location.uuid) || null;

            zipCodeSet.add(location.zip);

            // shortcuts for easier reference later
            location.hasAvailability = location.availability && 
                                       location.availability.times && 
                                       location.availability.times.length > 0;
            location.siteInstructions = location.siteInstructions.trim();
            location.accessibility = location.accessibility.trim();
            if(location.availability){
              const updatedMins = Math.floor(
                                    (new Date().getTime() - new Date(location.availability.fetched).getTime()) 
                                    / (1000 * 60));
              let agoString;
              if(updatedMins === 1){
                agoString = window.t('ui.min-ago');
              }else{
                agoString = window.t('ui.mins-ago');
              }
              location.lastUpdatedString = `${window.t('ui.updated')} ${updatedMins} ${agoString}`;
            }

            anyAvailability = location.hasAvailability || anyAvailability;

            return location;
          });

          this.zipCodes = Array.from(zipCodeSet).sort();
        }else{
          this.locationAvailability = [];
        }

        if(!anyAvailability){
          // if there is no availability at any location, turn this filter's
          //  default to off so the first thing we display to the user isn't "no data"
          this.filterShowOnlyAvailable = false;
        }
        this.filterLocations();

        this.isLoading = false;
      }).catch(err => {
        console.error(err);
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

window.notifyController = () => {
  return {
    reqLocation: {name: "Placeholder"},
    reqNumber: null,

    openModal(location){
      this.reqLocation = location;
      this.$store.modals.notify.open = true;
    },

    sendRequest(){
      this.$store.modals.notify.open = false;
      this.$store.modals.activity.state = 'loading';
      this.$store.modals.activity.open = true;
      
      const params = {
        location: this.reqLocation.uuid,
        sms: this.reqNumber,
        lang: shortLang
      };

      fetch(config.notifyAPIURL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.APIKey
        },
        body: JSON.stringify(params),
      })
        .then(res => this.$store.modals.activity.state = 'success' )
        .catch(err => {
          this.$store.modals.activity.state = 'failure';
          console.error(err);
        })
    }
  }
}