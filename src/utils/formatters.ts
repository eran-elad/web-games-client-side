export function getCountryName(countryCode: string): string {
    const countryMap: { [key: string]: string } = {
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
      AU: "Australia",
      FR: "France",
      DE: "Germany",
      IT: "Italy",
      ES: "Spain",
      JP: "Japan",
      KR: "South Korea",
      BR: "Brazil",
      MX: "Mexico",
      AR: "Argentina",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      NL: "Netherlands",
      BE: "Belgium",
      CH: "Switzerland",
      AT: "Austria",
      IE: "Ireland",
      NZ: "New Zealand",
      ZA: "South Africa",
      IN: "India",
      CN: "China",
      RU: "Russia",
      PL: "Poland",
      TR: "Turkey",
      GR: "Greece",
      PT: "Portugal",
    };
    return countryMap[countryCode] || countryCode;
  }

export function formatGenderValue(gender?: string): string {
    if (!gender) return "N/A";
    const genderMap: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      non_binary: "Non-Binary",
      "non-binary": "Non-Binary",
      all_male: "All Male",
      all_males: "All Male",
      all_female: "All Female",
      all_females: "All Female",
      all_non_binary: "All Non-Binary",
      mixed: "Mixed",
    };
    return genderMap[gender.toLowerCase()] || gender;
  }