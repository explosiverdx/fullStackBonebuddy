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

// Major cities by state (expanded; user can also type any city via input+datalist)
export const getCitiesByState = () => {
  return {
    'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Tirupati', 'Kadapa', 'Anantapur', 'Rajahmundry', 'Eluru', 'Ongole', 'Nandyal', 'Adoni'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Namsai', 'Ziro', 'Tezu', 'Bomdila', 'Changlang', 'Seppa'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Karimganj', 'Goalpara', 'Sivasagar', 'Barpeta'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Saharsa', 'Hajipur', 'Dehri'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Kanker', 'Janjgir', 'Baikunthpur'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Quepem', 'Cuncolim'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mahesana', 'Bharuch', 'Godhra', 'Palanpur', 'Valsad', 'Navsari', 'Veraval'],
    'Haryana': ['Gurgaon', 'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Panchkula', 'Sonipat', 'Yamunanagar', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar'],
    'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Palampur', 'Nahan', 'Baddi', 'Chamba', 'Una', 'Bilaspur', 'Hamirpur', 'Nurpur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Phusro', 'Ramgarh', 'Giridih', 'Medininagar', 'Chakradharpur', 'Dumka', 'Gumia', 'Saunda'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumakuru', 'Raichur', 'Bidar', 'Hospet', 'Gadag', 'Chitradurga', 'Hassan'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kottayam', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Datia'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Bhusawal', 'Panvel', 'Ulhasnagar', 'Pimpri-Chinchwad', 'Thane', 'Navi Mumbai'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Kakching', 'Senapati', 'Tamenglong'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Nongstoin', 'Resubelpara', 'Mawkyrwat'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Serchhip', 'Mamit', 'Kolasib', 'Lawngtlai'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jeypore', 'Bhawanipatna', 'Dhenkanal', 'Barbil', 'Jharsuguda', 'Angul'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Sangrur', 'Faridkot'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Kishangarh', 'Hanumangarh', 'Beawar', 'Churu', 'Gangapur', 'Sawai Madhopur', 'Chittorgarh'],
    'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Ravangla', 'Pelling', 'Jorethang'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Pollachi'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Mancherial', 'Nirmal', 'Sangareddy', 'Kothagudem', 'Miryalaguda', 'Jagtial', 'Bodhan'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Ambassa', 'Khowai', 'Belonia', 'Sabroom'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Prayagraj', 'Ghaziabad', 'Noida', 'Meerut', 'Aligarh', 'Bareilly', 'Moradabad', 'Saharanpur', 'Firozabad', 'Ayodhya', 'Gorakhpur', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Budaun', 'Sultanpur', 'Azamgarh', 'Bijnor', 'Basti', 'Chandausi', 'Akbarpur', 'Ballia', 'Tanda', 'Greater Noida'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Rudrapur', 'Kashipur', 'Pithoragarh', 'Ramnagar', 'Mussoorie', 'Nainital', 'Tehri', 'Pauri', 'Almora', 'Champawat', 'Vikasnagar', 'Kichha'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat', 'Bamboo Flat', 'Garacharma'],
    'Chandigarh': ['Chandigarh', 'Mohali', 'Panchkula'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa', 'Naroli', 'Amli', 'Rakholi'],
    'Delhi': ['New Delhi', 'Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Connaught Place'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Kupwara', 'Samba', 'Leh', 'Kargil', 'Pulwama', 'Ganderbal', 'Budgam', 'Bandipore', 'Rajouri', 'Poonch', 'Reasi'],
    'Ladakh': ['Leh', 'Kargil', 'Nubra', 'Zanskar', 'Drass', 'Diskit'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Andrott', 'Kalpeni', 'Kadmat'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Ozhukarai'],
  };
};

// Fetch state and city from pincode via our backend (avoids CORS on localhost).
// Returns { state, city } or null. Does not fetch or return address.
export const getAddressFromPincode = async (pincode) => {
  try {
    const digits = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) return null;

    const response = await fetch(`/api/v1/pincode/${digits}`);
    const json = await response.json();

    if (response.ok && json?.data) {
      const { state, city } = json.data;
      if (state || city) {
        return { state: state || '', city: city || '', area: '', address: '' };
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching state/city from pincode:', error);
    return null;
  }
};

