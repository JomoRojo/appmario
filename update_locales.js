const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  de: {
    "onboarding_phone_invalid_real": "Die eingegebene Nummer ist für dieses Land ungültig",
    "onboarding_birth_date_format": "Das Format muss TT/MM/JJJJ sein"
  },
  en: {
    "onboarding_phone_invalid_real": "The entered number is invalid for this country",
    "onboarding_birth_date_format": "Format must be DD/MM/YYYY"
  },
  es: {
    "onboarding_phone_invalid_real": "El número introducido no es válido para este país",
    "onboarding_birth_date_format": "El formato debe ser DD/MM/AAAA"
  },
  fr: {
    "onboarding_phone_invalid_real": "Le numéro saisi n'est pas valide pour ce pays",
    "onboarding_birth_date_format": "Le format doit être JJ/MM/AAAA"
  },
  it: {
    "onboarding_phone_invalid_real": "Il numero inserito non è valido per questo paese",
    "onboarding_birth_date_format": "Il formato deve essere GG/MM/AAAA"
  },
  pt: {
    "onboarding_phone_invalid_real": "O número inserido não é válido para este país",
    "onboarding_birth_date_format": "O formato deve ser DD/MM/AAAA"
  }
};

for (const file of files) {
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (newKeys[lang]) {
    data["onboarding_phone_invalid_real"] = newKeys[lang]["onboarding_phone_invalid_real"];
    data["onboarding_birth_date_format"] = newKeys[lang]["onboarding_birth_date_format"];
  }

  // Insert before the last closing brace by converting back to JSON
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
}
