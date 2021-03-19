import turfDistance from '@turf/distance';
import { point as turfPoint } from '@turf/helpers';
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

    filterShowOnlyAvailable: false,
    filterSearch: null,
    showZipRange: false,
    filterZipRange: 25,

    locationAvailability: [],

    filteredLocationAvailability: [],
    filteredLocationsWithAvailabilityString: '',

    sortMethod: 'availability',

    zipCodes: [],

    getCoordsForZip(code){
      const obj = this.zipCodes.find(zip => zip.zip === code);
      if(obj){
        return [obj.lng, obj.lat];
      }else{
        return null;
      }
    },

    sortComparator(){
      switch(this.sortMethod){
        case 'availability':

          return (left, right) => {
            if(left.hasAvailability){
              if(right.hasAvailability){
                return 0;
              }
              return -1;
            }else{
              return 1;
            }
          };
          
          break;

        default:
          return (left, right) => 0;
      }
    },

    fetchLocations(){
      let data = {};

      Promise.all([
        fetch(config.locationsURL)
          .then(res => res.json())
          .then(json => data.locations = json),
        fetch(config.availabilityURL)
          .then(res => res.json())
          .then(json => data.availability = json),
        fetch(config.zipCodesURL)
          .then(res => res.json())
          .then(json => this.zipCodes = json)
      ]).then(() => {
        let anyAvailability = false;

        if(data.locations && data.locations.length > 0){

          this.locationAvailability = data.locations.map((location) => {
            location.availability = data.availability.find(avail => avail && avail.location && avail.location === location.uuid) || {times: []};

            // shortcuts for easier reference later
            location.hasAvailability = location.availability && 
                                       location.availability.times && 
                                       location.availability.times.length > 0;
            location.siteInstructions = location.siteInstructions.trim();
            location.accessibility = location.accessibility.trim();
            if(location.availability){

              let updatedTime = Math.floor(
                                  (new Date().getTime() - new Date(location.availability.fetched).getTime()) 
                                  / 1000);
              let agoString,
                  incType = 'sec';

              // if < 2 mins, show in seconds, else minutes
              if(updatedTime >= 120){
                updatedTime = Math.floor(updatedTime / 60);
                incType = 'min';
              }

              if(updatedTime !== 1){
                incType += 's';
              }

              agoString = window.t(`ui.${incType}-ago`);
              location.lastUpdatedString = `${window.t('ui.updated')} ${updatedTime} ${agoString}`;
            }

            anyAvailability = location.hasAvailability || anyAvailability;

            location.caveats = location.caveats || [];

            return location;
          });

        }else{
          this.locationAvailability = [];
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
      let counter = 0;

      const zipRegex = /^[0-9]{5}$/,
            isFilterZip = this.filterSearch && zipRegex.test(this.filterSearch.trim());

      this.filteredLocationAvailability = this.locationAvailability.filter((location) => {
        let valid = true;

        if(this.filterShowOnlyAvailable){
          valid = valid && location.hasAvailability;
        }

        if(isFilterZip){
          this.showZipRange = true;
          const from = turfPoint(this.getCoordsForZip(location.zip)),
                to = turfPoint(this.getCoordsForZip(this.filterSearch));

          valid = valid && turfDistance(from, to, {units: 'miles'}) <= this.filterZipRange;
        }else{
          this.showZipRange = false;
        }

        if(this.filterSearch && !isFilterZip){
          const textContent = `${location.name} ${location.address} ${location.siteInstructions} ${location.accessibility}`;

          valid = valid && textContent.toLowerCase().includes(this.filterSearch.toLowerCase());
        }

        if(valid && location.hasAvailability){
          counter++;
        }

        return valid;
      });

      this.filteredLocationAvailability.sort(this.sortComparator());

      this.filteredLocationsWithAvailabilityString = `${counter} ${t( counter === 1 ? 'ui.location-with-availability' : 'ui.locations-with-availability' )}`;
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