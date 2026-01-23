// Indian States List
export const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Major cities by state
export const getCitiesByState = () => {
  return {
    'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer'],
    'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  };
};

// Fetch address from pincode using India Post API
export const getAddressFromPincode = async (pincode) => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].Status === 'Success') {
        const postOffices = data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          const office = postOffices[0];
          
          // Extract state, district, and city
          const state = (office.State || '').trim();
          const district = (office.District || '').trim();
          const city = (office.City || '').trim();
          const area = (office.Name || '').trim();
          
          // Use District as city if City is empty, otherwise use City
          let finalCity = city || district;
          
          // If both are empty, try to get from other post offices
          if (!finalCity && postOffices.length > 1) {
            for (const po of postOffices) {
              const poDistrict = (po.District || '').trim();
              const poCity = (po.City || '').trim();
              if (poCity) {
                finalCity = poCity;
                break;
              } else if (poDistrict) {
                finalCity = poDistrict;
                break;
              }
            }
          }
          
          // Build address string
          let address = '';
          if (area) address += area;
          if (district) {
            if (address) address += ', ';
            address += district;
          }
          if (state) {
            if (address) address += ', ';
            address += state;
          }
          
          return {
            state: state,
            city: finalCity || district,
            area: area,
            address: address || `${area}, ${district}, ${state}`,
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching address from pincode:', error);
    return null;
  }
};

