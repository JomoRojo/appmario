const { Country, State, City } = require('country-state-city');

const spainStates = State.getStatesOfCountry('ES');
console.log('Spains States (First 5):', spainStates.slice(0, 5).map(s => s.name));

const madridCities = City.getCitiesOfState('ES', spainStates.find(s => s.name.includes('Madrid')).isoCode);
console.log('Madrid Cities (First 5):', madridCities.slice(0, 5).map(c => c.name));
